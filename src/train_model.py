import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
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
    
    print("4. Initializing and training CatBoostRegressor...")
    categorical_features_indices = [0, 1]  # 'District' and 'City' are at index 0 and 1
    
    model = CatBoostRegressor(
        iterations=500,
        learning_rate=0.1,
        depth=6,
        random_seed=42,
        cat_features=categorical_features_indices,
        verbose=100  # Print progress every 100 iterations
    )
    
    model.fit(X_train, y_train, eval_set=(X_test, y_test), early_stopping_rounds=50)
    
    print("\n5. Evaluating model...")
    y_pred = model.predict(X_test)
    
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f}")
    print(f"Mean Absolute Error (MAE): {mae:.2f}")
    print(f"R-squared (R2 Score): {r2:.4f}")
    
    print("\n6. Saving model...")
    model_path = 'models/catboost_land_model.cbm'
    model.save_model(model_path)
    print(f"Model successfully saved to {model_path}")
    
    print("\n7. Generating SHAP summary plot...")
    # Initialize JS visualization for SHAP if using notebooks, but for script we just plot
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test)
    
    # Ensure matplotlib uses a non-interactive backend so it doesn't block execution
    plt.switch_backend('Agg')
    
    # Generate summary plot
    shap.summary_plot(shap_values, X_test, show=False)
    plot_path = 'results/shap_summary_plot.png'
    plt.savefig(plot_path, bbox_inches='tight', dpi=300)
    print(f"SHAP summary plot saved to {plot_path}")
    
    print("Training process complete!")

if __name__ == '__main__':
    main()
