import pandas as pd
import numpy as np
import sys

def clean_dataset():
    input_file = 'data/raw/land_data_final.csv'
    output_file = 'data/processed/cleaned_land_data1.csv'
    
    # 1. Load the dataset
    print(f"Loading raw dataset from {input_file}...")
    try:
        df = pd.read_csv(input_file)
    except FileNotFoundError:
        print(f"Error: Could not find {input_file}")
        sys.exit(1)
        
    initial_rows = len(df)
    print(f"Initial row count: {initial_rows}")

    # 2. Remove any duplicate rows BEFORE dropping identifying columns!
    df = df.drop_duplicates(subset=['Listing URL'])

    # 3. Drop specific columns completely
    columns_to_drop = ['Listing title', 'Road access type', 'Posted date', 'Listing URL']
    df = df.drop(columns=[col for col in columns_to_drop if col in df.columns], errors='ignore')
    
    # 4. CRITICAL STEP: Drop the 'Total price (LKR)' column to prevent target leakage
    if 'Total price (LKR)' in df.columns:
        df = df.drop(columns=['Total price (LKR)'])
        print("Dropped 'Total price (LKR)' to prevent target leakage.")

    # 5. Filter out rows with missing, NaN, or "null" in specific columns
    critical_cols = ['Price per perch', 'Land size', 'District', 'City']
    
    # Replace literal strings "null" or "unknown" with actual NaN
    df.replace('null', np.nan, inplace=True)
    df.replace('unknown', np.nan, inplace=True)
    
    # Convert 'Price per perch' and 'Land size' to numeric first, invalid parsing will be set to NaN
    # This ensures string text that might be inside numeric columns are coerced to NaN
    df['Price per perch'] = pd.to_numeric(df['Price per perch'], errors='coerce')
    df['Land size'] = pd.to_numeric(df['Land size'], errors='coerce')
    
    # Drop rows with NaN in the critical columns
    df = df.dropna(subset=critical_cols)

    # 6. Convert numeric columns to float
    df['Price per perch'] = df['Price per perch'].astype(float)
    df['Land size'] = df['Land size'].astype(float)

    # 7. Ensure electricity and tap water are integers
    for col in ['Availability of electricity', 'Availability of tap water']:
        if col in df.columns:
            # First coerce to numeric, fill any NaNs with 0, then tightly cast to int
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype('int32')

    # 8. Remove duplicate features that became identical after dropping URL/Titles
    df = df.drop_duplicates()

    # 9. Print dataset summaries before and after
    final_rows = len(df)
    print(f"\nFinal row count: {final_rows}")
    print(f"Total rows dropped: {initial_rows - final_rows}")
    
    print("\nNull Value Check Across All Remaining Columns:")
    print(df.isnull().sum())
    
    print("\nFinal Column Data Types:")
    print(df.dtypes)
    
    print(f"\nSample of cleaned data:")
    print(df.head())

    # 9. Save the preprocessed dataset
    df.to_csv(output_file, index=False, encoding='utf-8')
    print(f"\nDataset successfully saved to {output_file}")

if __name__ == '__main__':
    clean_dataset()
