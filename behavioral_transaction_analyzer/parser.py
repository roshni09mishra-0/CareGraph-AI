import re
import pandas as pd
import numpy as np
from datetime import datetime

class TransactionSMSParser:
    """
    NLP & Regex parser for bank and payment transaction SMS notifications.
    Extracts structured fields: Amount, Merchant, Category, Timestamp, Transaction Type, and Payment Channel.
    """

    # Category mappings based on merchant keywords and intent patterns
    CATEGORY_RULES = {
        'Food & Dining': [
            r'zomato', r'swiggy', r'starbucks', r'mcdonald', r'domino', r'pizza', r'burger', 
            r'cafe', r'restaurant', r'bakery', r'kfc', r'subway', r'dunkin', r'bar', r'pub',
            r'eats', r'food', r'tea', r'coffee', r'baskin'
        ],
        'Groceries & Quick Commerce': [
            r'zepto', r'blinkit', r'instamart', r'bigbasket', r'grofers', r'supermarket', 
            r'dmart', r'more retail', r'reliance fresh', r'nature basket', r'grocery'
        ],
        'Shopping & E-Commerce': [
            r'amazon', r'flipkart', r'myntra', r'ajio', r'zara', r'nike', r'adidas', r'uniqlo', 
            r'h&m', r'lifestyle', r'trends', r'nykaa', r'meesho', r'retail', r'store', r'mall', r'electronics'
        ],
        'Travel & Transport': [
            r'uber', r'ola', r'rapido', r'blusmart', r'makemytrip', r'goibibo', r'irctc', r'indigo', 
            r'air india', r'akasa', r'fuel', r'shell', r'hpcl', r'bpcl', r'iocl', r'metro', r'toll', r'fastag'
        ],
        'Bills & Utilities': [
            r'electricity', r'water', r'gas', r'airtel', r'jio', r'vi', r'vodafone', r'broadband', 
            r'tata play', r'dth', r'bescom', r'mseb', r'rent', r'bill payment', r'recharge'
        ],
        'Entertainment & Subscriptions': [
            r'netflix', r'spotify', r'prime', r'youtube', r'disney', r'hotstar', r'bookmyshow', 
            r'pvr', r'inox', r'steam', r'playstation', r'apple', r'subscription', r'cinema'
        ],
        'Health & Fitness': [
            r'apollo', r'pharmacy', r'medplus', r'pharmeasy', r'1mg', r'cult\.fit', r'gym', 
            r'hospital', r'clinic', r'lab', r'dr', r'diagnostic'
        ],
        'Investments & Finance': [
            r'zerodha', r'groww', r'upstox', r'sip', r'mutual fund', r'lic', r'insurance', 
            r'npic', r'hdfc life', r'cred', r'investment', r'ppf'
        ],
        'Cash & ATM': [
            r'atm', r'cash withdrawal', r'nfs', r'cash wdl'
        ]
    }

    @staticmethod
    def classify_category(merchant_name: str, raw_text: str) -> str:
        """Classify transaction into standard expense categories based on merchant name and text context."""
        text_to_search = f"{merchant_name} {raw_text}".lower()
        
        for category, patterns in TransactionSMSParser.CATEGORY_RULES.items():
            for pattern in patterns:
                if re.search(pattern, text_to_search, re.IGNORECASE):
                    return category
                    
        return 'General & Others'

    @staticmethod
    def extract_payment_channel(sms_text: str) -> str:
        """Extract the payment method used (UPI, Credit Card, Debit Card, NetBanking, ATM)."""
        sms_lower = sms_text.lower()
        if 'upi' in sms_lower or 'vpa' in sms_lower or 'gpay' in sms_lower or 'phonepe' in sms_lower or 'paytm' in sms_lower:
            return 'UPI'
        elif 'credit card' in sms_lower or 'cc' in sms_lower or 'card ending' in sms_lower:
            return 'Credit Card'
        elif 'debit card' in sms_lower or 'dc' in sms_lower:
            return 'Debit Card'
        elif 'atm' in sms_lower or 'cash' in sms_lower:
            return 'ATM / Cash'
        elif 'netbanking' in sms_lower or 'neft' in sms_lower or 'imps' in sms_lower or 'rtgs' in sms_lower:
            return 'NetBanking / Transfer'
        return 'Other Channel'

    @classmethod
    def parse_single_sms(cls, sms_text: str, default_date: datetime = None) -> dict:
        """
        Parses a single SMS notification string into structured features.
        Returns a dictionary or None if not a valid transaction SMS.
        """
        if not sms_text or not isinstance(sms_text, str):
            return None

        clean_text = sms_text.strip()

        # Determine transaction type (Debit vs Credit)
        is_credit = bool(re.search(r'\b(credited|received|refunded|deposited)\b', clean_text, re.IGNORECASE))
        is_debit = bool(re.search(r'\b(debited|spent|paid|transferred|withdrawn|sent|deducted)\b', clean_text, re.IGNORECASE))
        
        if not (is_credit or is_debit):
            # If neither explicit keyword, check for amount presence to avoid ignoring valid logs
            if not re.search(r'(rs\.?|inr|₹|\$)\s*[\d,]+', clean_text, re.IGNORECASE):
                return None
            txn_type = 'Debit'
        else:
            txn_type = 'Credit' if is_credit else 'Debit'

        # Regex for Amount extraction (supports Rs., INR, ₹, $, optional commas)
        amt_match = re.search(r'(?:rs\.?|inr|₹|\$)\s*([\d,]+(?:\.\d{1,2})?)', clean_text, re.IGNORECASE)
        if not amt_match:
            # Fallback regex for pure digits following 'for' or 'amt'
            amt_match = re.search(r'(?:amount|amt|for)\s*:?\s*([\d,]+(?:\.\d{1,2})?)', clean_text, re.IGNORECASE)

        if not amt_match:
            return None

        try:
            amount_str = amt_match.group(1).replace(',', '')
            amount = float(amount_str)
        except ValueError:
            return None

        # Merchant / Payee Extraction
        merchant = "Unknown Payee"
        
        # Patterns like: "to <Merchant>", "at <Merchant>", "info: <Merchant>", "vpa <Merchant>@"
        merchant_patterns = [
            r'paid to\s+([\w\s&\.\-]+?)(?=\s+on|\s+ref|\s+using|\s+via|\s+avbl|\s+a/c|\.|$)',
            r'at\s+([\w\s&\.\-]+?)(?=\s+on|\s+ref|\s+using|\s+via|\s+avbl|\s+a/c|\.|$)',
            r'to\s+([\w\s&\.\-]+?)(?=\s+on|\s+ref|\s+using|\s+via|\s+avbl|\s+a/c|\.|$)',
            r'vpa\s+([\w\.\-]+)@',
            r'info[:\s]+([\w\s&\.\-]+?)(?=\s+on|\s+ref|\.|$)',
            r'towards\s+([\w\s&\.\-]+?)(?=\s+on|\s+ref|\.|$)'
        ]

        for p in merchant_patterns:
            m = re.search(p, clean_text, re.IGNORECASE)
            if m:
                extracted = m.group(1).strip()
                # Clean noise words
                extracted = re.sub(r'^(the|a|an|ref|upi|ac|account)\s+', '', extracted, flags=re.IGNORECASE)
                if len(extracted) > 1 and not extracted.isdigit():
                    merchant = extracted.title()
                    break

        # Date & Time extraction
        dt = default_date if default_date else datetime.now()
        
        # Look for timestamps in formats: DD-MM-YYYY HH:MM, DD/MM/YY HH:MM:SS, YYYY-MM-DD HH:MM
        date_patterns = [
            r'(\d{2}[-/\.]\d{2}[-/\.]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?)',
            r'(\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}\s+\d{1,2}:\d{2})',
            r'(\d{2}[-/\.]\d{2}[-/\.]\d{2,4})'
        ]

        for dp in date_patterns:
            dt_match = re.search(dp, clean_text)
            if dt_match:
                raw_dt_str = dt_match.group(1)
                for fmt in (
                    "%d-%m-%Y %H:%M", "%d/%m/%Y %H:%M", "%d-%m-%y %H:%M", "%d/%m/%y %H:%M",
                    "%d %b %Y %H:%M", "%d %b %y %H:%M", "%d-%b-%Y %H:%M", "%d-%b-%y %H:%M",
                    "%d-%m-%Y", "%d/%m/%Y", "%d-%m-%y", "%d/%m/%y"
                ):
                    try:
                        dt = datetime.strptime(raw_dt_str, fmt)
                        break
                    except ValueError:
                        continue
                break

        category = cls.classify_category(merchant, clean_text)
        channel = cls.extract_payment_channel(clean_text)

        return {
            'timestamp': dt,
            'amount': amount,
            'merchant': merchant,
            'category': category,
            'transaction_type': txn_type,
            'payment_channel': channel,
            'raw_sms': clean_text
        }

    @classmethod
    def parse_batch_sms(cls, text_block: str) -> pd.DataFrame:
        """Parses a multi-line string containing multiple transaction SMS notifications."""
        lines = [line.strip() for line in text_block.split('\n') if line.strip()]
        parsed_records = []
        
        for line in lines:
            parsed = cls.parse_single_sms(line)
            if parsed:
                parsed_records.append(parsed)
                
        if not parsed_records:
            return pd.DataFrame(columns=[
                'timestamp', 'amount', 'merchant', 'category', 
                'transaction_type', 'payment_channel', 'raw_sms'
            ])

        df = pd.DataFrame(parsed_records)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df.sort_values('timestamp', ascending=False).reset_index(drop=True)
