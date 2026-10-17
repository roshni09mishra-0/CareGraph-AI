import pandas as pd
import numpy as np
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

class TransactionCategorizer:
    """
    Categorizes financial transactions into behavioral domain categories:
    Food & Dining, Grocery & Supplies, Shopping & E-Commerce, Travel & Transport,
    Bills & Utilities, Digital & Subscriptions, Health & Wellness, Investments & Transfers,
    Entertainment & Leisure.
    """
    
    KEYWORD_MAP = {
        'Food & Dining': [
            'swiggy', 'zomato', 'starbucks', 'mcdonalds', 'kfc', 'dominos', 'pizza',
            'restaurant', 'cafe', 'diner', 'burger', 'bakery', 'taco', 'eatclub',
            'food', 'dining', 'coffee', 'subway', 'bar', 'bistro'
        ],
        'Grocery & Daily Needs': [
            'blinkit', 'zepto', 'instamart', 'bigbasket', 'grocery', 'supermarket',
            'mart', 'd-mart', 'hypermarket', 'dairy', 'milk', 'provisions', 'nature basket'
        ],
        'Shopping & E-Commerce': [
            'amazon', 'flipkart', 'myntra', 'zara', 'h&m', 'nykaa', 'ajio', 'meesho',
            'apparel', 'fashion', 'store', 'retail', 'electronics', 'clothing', 'footwear'
        ],
        'Travel & Ride': [
            'uber', 'ola', 'rapido', 'irctc', 'makemytrip', 'goibibo', 'indigo',
            'flight', 'airline', 'cab', 'taxi', 'metro', 'toll', 'fastag', 'fuel', 'petrol', 'hpcl', 'iocl'
        ],
        'Bills & Utilities': [
            'electricity', 'bescom', 'tata power', 'airtel', 'jio', 'vi', 'broadband',
            'water', 'gas', 'bill', 'recharge', 'utility', 'insurance', 'policybazaar'
        ],
        'Digital & Subscriptions': [
            'netflix', 'spotify', 'prime', 'youtube', 'apple', 'google play', 'chatgpt',
            'openai', 'playstation', 'steam', 'disney', 'hotstar', 'cloud', 'subscription'
        ],
        'Entertainment & Leisure': [
            'bookmyshow', 'pvr', 'inox', 'cinema', 'movie', 'bowling', 'gaming',
            'concert', 'event', 'club', 'resort'
        ],
        'Health & Fitness': [
            'pharmacy', 'apollo', 'cult.fit', 'gym', 'hospital', 'doctor', 'clinic',
            'medplus', '1mg', 'pharmeasy', 'lab', 'fitness'
        ],
        'Investments & Financial': [
            'zerodha', 'groww', 'indmoney', 'sip', 'mutual fund', 'deposit', 'loan',
            'emi', 'lic', 'tax', 'wealth'
        ]
    }

    def __init__(self):
        self.ml_pipeline = None
        self._train_initial_model()

    def _train_initial_model(self):
        """Trains a TF-IDF + Naive Bayes classifier on keyword training data for fallback ML classification."""
        train_texts = []
        train_labels = []

        for category, keywords in self.KEYWORD_MAP.items():
            for kw in keywords:
                # Add variations
                train_texts.extend([kw, f"payment to {kw}", f"purchase at {kw}", f"{kw} store", f"txn {kw}"])
                train_labels.extend([category] * 5)

        self.ml_pipeline = make_pipeline(
            TfidfVectorizer(ngram_range=(1, 2), min_df=1),
            MultinomialNB(alpha=0.1)
        )
        self.ml_pipeline.fit(train_texts, train_labels)

    def categorize_transaction(self, merchant: str, raw_sms: str = "") -> str:
        """Determines the category using regex keyword matching first, falling back to ML classifier."""
        text_to_check = f"{merchant} {raw_sms}".lower()

        # 1. Direct Regex/Keyword Matching
        for category, keywords in self.KEYWORD_MAP.items():
            for kw in keywords:
                if re.search(r'\b' + re.escape(kw) + r'\b', text_to_check):
                    return category

        # 2. ML Classifier Fallback
        try:
            predicted = self.ml_pipeline.predict([text_to_check])[0]
            return predicted
        except Exception:
            return "General & Uncategorized"

    def categorize_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Applies categorization to an entire DataFrame of parsed transactions."""
        if df.empty:
            df['category'] = []
            return df
            
        df = df.copy()
        df['category'] = df.apply(
            lambda row: self.categorize_transaction(str(row.get('merchant', '')), str(row.get('raw_sms', ''))),
            axis=1
        )
        return df
