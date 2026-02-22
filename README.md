# LankaLand Predictor - Real Estate ML Valuation API

A full-stack intelligent Machine Learning application that uses a sophisticated **CatBoost Regressor** model to predict real estate and empty land prices across Sri Lanka based on regional datasets, land size, and core amenities.

## 🏗️ Project Architecture

This project is separated into a Python Data Science REST API layer and a modern React User Interface.

```text
ml-assignment/
│
├── ML_Assignment_Report.ipynb # The Academic Colab Notebook
│
├── data/               # Contains original scrape and cleaned CSV
│   ├── raw/            
│   └── processed/      
│
├── models/             # Contains the trained .cbm model weights
│   └── catboost_land_model.cbm
│
├── results/            # Training output metrics and SHAP visualizations
│   ├── shap_summary_plot.png
│   └── train_output.txt
│
├── src/                # Backend Python logic and REST API
│   ├── scraper.py      # Ikman.lk raw property web scraper
│   ├── data_cleaner.py # Processing pipelines and duplicate droppers
│   ├── train_model.py  # Model trainer (CatBoost, SHAP generation)
│   └── api.py          # Flask backend REST endpoint interface
│
└── frontend/           # The Vite React + TailwindCSS User Interface
    ├── src/
    │   ├── App.jsx     # Main interface component
    │   └── main.jsx
    └── ...
```

## 🚀 Setting Up the Project Locally

### 1. Booting the Machine Learning API (Flask Backend)
The backend model inference server uses Python and Flask.

1. Open a terminal in the root repository directory.
2. Install the target Python dependencies:
```bash
pip install pandas scikit-learn catboost shap flask flask-cors
```
3. Run the Flask Server:
```bash
python src/api.py
```
*The endpoint will boot up and load the `.cbm` model onto `http://localhost:5000`.*

### 2. Booting the User Interface (React Frontend)
The front-end user dashboard is driven by Vite and styled with Tailwind CSS v4.

1. Open a **new separate terminal** and navigate into the frontend folder:
```bash
cd frontend
```
2. Install the Node packages:
```bash
npm install
```
3. Start the Vite React development server:
```bash
npm run dev
```

*The interface will generate and should automatically be served to `http://localhost:5173`. Select your district and click "Estimate" to hit the API!*

## 📊 Academic Model Details

1. **Baseline Model**: Evaluates a standard `RandomForestRegressor` via scikit-learn Pipeline to set a performance floor.
2. **Main Algorithm**: **CatBoost Regressor** (Gradient Boosting that handles Sri Lankan city strings inherently).
3. **Hyperparameter Tuning**: Utilizes `RandomizedSearchCV` cross-validation to algorithmically tune `iterations`, `learning_rate`, and `depth` to prevent overfitting.
4. **Train/Test Split**: **80% / 20%**
5. **Predictive Features**: `District` (categorical), `City` (categorical), `Land size` (continuous), `Availability of electricity` (binary), `Availability of tap water` (binary).

## 🧠 Explainable AI (XAI)
This project implements **SHAP (SHapley Additive exPlanations)** natively across the stack:
- **Global Interpretability**: Built during `train_model.py`, proving `District` is the overwhelming #1 priority for predicting value accurately, closely followed by `City`.
- **Local Interpretability (Dynamic XAI)**: The `/api/predict` endpoint dynamically calculates tree SHAP contributions per property submission. The React UI converts this into a visual force graph allowing end-users to see exactly how much $LKR their water/electricity hookups add to their property's valuation.
