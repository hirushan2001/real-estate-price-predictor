import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from catboost import CatBoostRegressor
import shap
import matplotlib.pyplot as plt

def main():
    print("1. Loading dataset...")
    df = pd.read_csv('data/processed/cleaned_land_data1.csv')
    
    print("2. Defining target and features...")
    # Target variable
    y = df['Price per perch'].astype(float)
    
    # Feature matrix
    X = df[['District', 'City', 'Land size', 'Availability of electricity', 'Availability of tap water']].copy()
    
    # Ensure types
    X['District'] = X['District'].astype(str)
    X['City'] = X['City'].astype(str)
    X['Land size'] = X['Land size'].astype(float)
    X['Availability of electricity'] = X['Availability of electricity'].astype(int)
    X['Availability of tap water'] = X['Availability of tap water'].astype(int)
    
    print("3. Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")
    
    print("\n--- BASELINE MODEL COMPARISON ---")
    print("4a. Training Random Forest Baseline...")
    
    # Preprocessing for baseline (Random Forest needs numerical inputs)
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1), ['District', 'City'])
        ],
        remainder='passthrough'
    )
    
    rf_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('model', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    rf_pipeline.fit(X_train, y_train)
    rf_pred = rf_pipeline.predict(X_test)
    
    print("Random Forest Baseline Metrics:")
    print(f"RMSE: {np.sqrt(mean_squared_error(y_test, rf_pred)):.2f}")
    print(f"MAE:  {mean_absolute_error(y_test, rf_pred):.2f}")
    print(f"R2:   {r2_score(y_test, rf_pred):.4f}")
    
    print("\n--- ADVANCED MODEL (CATBOOST) ---")
    print("5a. Setting up Hyperparameter Tuning for CatBoost...")
    
    categorical_features_indices = ['District', 'City']  # 'District' and 'City'
    
    # Initial base model
    cb_base = CatBoostRegressor(
        random_seed=42,
        verbose=0
    )
    
    # Define hyperparameter grid
    param_grid = {
        'iterations': [200, 500],
        'learning_rate': [0.05, 0.1, 0.2],
        'depth': [4, 6]
    }
    
    print("Running RandomizedSearchCV (this may take a minute)...")
    random_search = RandomizedSearchCV(
        estimator=cb_base,
        param_distributions=param_grid,
        n_iter=5, # Limit iterations for faster execution in assignments
        cv=3,
        scoring='neg_root_mean_squared_error',
        random_state=42,
        n_jobs=-1
    )
    
    # We fit random search without early stopping to find best combo params roughly
    random_search.fit(X_train, y_train, cat_features=categorical_features_indices)
    
    print(f"Best Hyperparameters found: {random_search.best_params_}")
    
    print("\n5b. Training Best CatBoost Model with Early Stopping...")
    best_params = random_search.best_params_
    
    final_model = CatBoostRegressor(
        iterations=best_params['iterations'],
        learning_rate=best_params['learning_rate'],
        depth=best_params['depth'],
        cat_features=categorical_features_indices,
        random_seed=42,
        verbose=100
    )
    
    final_model.fit(X_train, y_train, eval_set=(X_test, y_test), early_stopping_rounds=50)
    
    print("\n5c. Evaluating final tuned model...")
    y_pred = final_model.predict(X_test)
    
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Tuned CatBoost RMSE: {rmse:.2f}")
    print(f"Tuned CatBoost MAE: {mae:.2f}")
    print(f"Tuned CatBoost R2 Score: {r2:.4f}")
    
    print("\n6. Saving models and tools...")
    model_path = 'models/catboost_land_model.cbm'
    final_model.save_model(model_path)
    print(f"Model successfully saved to {model_path}")
    
    print("\n7. Generating SHAP summary plot...")
    explainer = shap.TreeExplainer(final_model)
    shap_values = explainer.shap_values(X_test)
    
    # Ensure matplotlib uses a non-interactive backend
    plt.switch_backend('Agg')
    plt.figure()
    shap.summary_plot(shap_values, X_test, show=False)
    plot_path = 'results/shap_summary_plot.png'
    plt.savefig(plot_path, bbox_inches='tight', dpi=300)
    print(f"SHAP summary plot saved to {plot_path}")
    
    print("Training process complete!")

if __name__ == '__main__':
    main()
