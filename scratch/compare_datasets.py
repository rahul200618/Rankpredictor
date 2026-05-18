
import json
import pandas as pd
import os

# Paths
coded_json_path = r"c:\Users\asus\Downloads\coded\kcet_cutoffs_consolidated (2).json"
predictor_csv_path = r"c:\Users\asus\Downloads\KCET-College-Predictor\data\final\kcet_master.csv"

def compare_datasets():
    print("--- Comparing Datasets ---")
    
    # Load Coded JSON
    with open(coded_json_path, 'r') as f:
        coded_data = json.load(f)
    coded_df = pd.DataFrame(coded_data['cutoffs'])
    
    # Load Predictor CSV
    predictor_df = pd.read_csv(predictor_csv_path)
    
    print(f"Coded JSON Entries: {len(coded_df)}")
    print(f"Predictor CSV Entries: {len(predictor_df)}")
    
    print(f"\nCoded JSON Years: {coded_df['year'].unique()}")
    print(f"Predictor CSV Years: {predictor_df['Year'].unique()}")
    
    print(f"\nCoded JSON Rounds: {coded_df['round'].unique() if 'round' in coded_df.columns else 'N/A'}")
    
    # Compare common colleges
    coded_colleges = set(coded_df['institute_code'].unique())
    predictor_colleges = set(predictor_df['College_Code'].unique())
    common_colleges = coded_colleges.intersection(predictor_colleges)
    
    print(f"\nCoded unique colleges: {len(coded_colleges)}")
    print(f"Predictor unique colleges: {len(predictor_colleges)}")
    print(f"Common colleges (by code): {len(common_colleges)}")
    
    # Compare common categories
    coded_cats = set(coded_df['category'].unique())
    predictor_cats = set(predictor_df['Category'].unique())
    common_cats = coded_cats.intersection(predictor_cats)
    
    print(f"\nCoded unique categories: {len(coded_cats)}")
    print(f"Predictor unique categories: {len(predictor_cats)}")
    print(f"Common categories: {len(common_cats)}")
    
    # Sample check for a specific college and category
    sample_code = "E001"
    sample_cat = "GM"
    
    print(f"\n--- Sample Check for {sample_code} ({sample_cat}) ---")
    coded_sample = coded_df[(coded_df['institute_code'] == sample_code) & (coded_df['category'] == sample_cat) & (coded_df['year'] == '2024')]
    predictor_sample = predictor_df[(predictor_df['College_Code'] == sample_code) & (predictor_df['Category'] == sample_cat) & (predictor_df['Year'] == 2024)]
    
    print(f"Coded 2024 entries for {sample_code}: {len(coded_sample)}")
    print(f"Predictor 2024 entries for {sample_code}: {len(predictor_sample)}")
    
    if not coded_sample.empty and not predictor_sample.empty:
        print("\nCoded Top 5:")
        print(coded_sample[['course', 'cutoff_rank', 'round']].sort_values('cutoff_rank').head(5))
        print("\nPredictor Top 5:")
        print(predictor_sample[['Branch', 'Cutoff_Rank']].sort_values('Cutoff_Rank').head(5))

if __name__ == "__main__":
    compare_datasets()
