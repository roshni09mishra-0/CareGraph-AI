import re
import pandas as pd
from datetime import datetime

class TransactionSMSParser:
    """
    Regex and NLP-assisted parser for transaction SMS and notifications.
    Extracts Amount, Merchant, Date, Time, Transaction Type (Debit/Credit), and Payment Channel.
    """
    
    # Regex patterns for key components
    AMOUNT_PATTERNS = [
        r'(?:rs\.?|inr|\$|usd)\s*([\d,]+\.?\d*)',
        r'([\d,]+\.?\d*)\s*(?:rs|inr|\$|usd)',
        r'(?:debited|credited|spent|paid|withdrawn|received)\s+(?:by|with|of)?\s*(?:rs\.?|inr|\$)?\s*([\d,]+\.?\d*)',
        r'(?:amt|amount)\s*(?:of)?\s*(?:rs\.?|inr|\$)?\s*([\d,]+\.?\d*)'
    ]
    
    MERCHANT_PATTERNS = [
        r'(?:at|to|vpa|info|vendor|towards)\s+([A-Za-z0-9\s&\.\*_\-\']+?)(?=\s+(?:on|via|using|ref|bal|avail|a/c|card|with|at|\.|$))',
        r'paid\s+to\s+([A-Za-z0-9\s&\.\*_\-\']+?)(?=\s+(?:via|on|ref|\.|$))',
        r'spent\s+(?:rs\.?|inr|\$)?\s*[\d,]+\.?\d*\s+at\s+([A-Za-z0-9\s&\.\*_\-\']+?)(?=\s+(?:using|on|via|ref|\.|$))',
        r'txn\s+at\s+([A-Za-z0-9\s&\.\*_\-\']+?)(?=\s+(?:on|using|via|\.|$))'
    ]
    
    PAYMENT_MODE_PATTERNS = [
        (r'upi', 'UPI'),
        (r'credit\s*card|cc', 'Credit Card'),
        (r'debit\s*card|dc', 'Debit Card'),
        (r'net\s*banking|neft|rtgs|imps', 'NetBanking'),
        (r'wallet|paytm|phonepe|gpay', 'Wallet/UPI'),
        (r'atm|cash', 'ATM Withdrawal')
    ]
    
    @staticmethod
    def clean_merchant_name(raw_merchant: str) -> str:
        if not raw_merchant:
            return "Unknown Merchant"
            
        merchant = raw_merchant.strip()
        # Remove common noisy transaction prefixes/suffixes
        merchant = re.sub(r'^(the|pvt|ltd|inc|corp|payto)\s+', '', merchant, flags=re.IGNORECASE)
        merchant = re.sub(r'(\*|\.com|vpa|pos|pg|paytm|billdesk|razorpay|upi)', '', merchant, flags=re.IGNORECASE)
        merchant = re.sub(r'\s+', ' ', merchant).strip()
        
        # Capitalize nicely
        if len(merchant) > 0:
            return merchant.title()
        return "General Merchant"

    @classmethod
    def parse_single_sms(cls, text: str, default_date: datetime = None) -> dict:
        """Parses a single SMS text string into structured transaction attributes."""
        text_lower = text.lower()
        
        # 1. Transaction Type (Debit vs Credit)
        tx_type = 'Debit'
        if any(word in text_lower for word in ['credited', 'received', 'added to', 'refund', 'deposit']):
            tx_type = 'Credit'
        elif any(word in text_lower for word in ['debited', 'spent', 'paid', 'withdrawn', 'sent to', 'charged']):
            tx_type = 'Debit'
            
        # 2. Extract Amount
        amount = 0.0
        for pattern in cls.AMOUNT_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                val_str = match.group(1).replace(',', '')
                try:
                    val = float(val_str)
                    if val > 0:
                        amount = val
                        break
                except ValueError:
                    continue

        # 3. Extract Merchant / Recipient
        merchant = "Unknown Vendor"
        for pattern in cls.MERCHANT_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                candidate = match.group(1).strip()
                # filter out false positives like numbers or single characters or dates
                if len(candidate) > 2 and not candidate.isdigit() and not re.match(r'^\d{2}[-/\.]\d{2}', candidate):
                    merchant = cls.clean_merchant_name(candidate)
                    break

        # 4. Extract Payment Mode
        payment_mode = 'Card / Digital'
        for pattern, mode_name in cls.PAYMENT_MODE_PATTERNS:
            if re.search(pattern, text_lower):
                payment_mode = mode_name
                break

        # 5. Extract Date and Time
        parsed_dt = default_date or datetime.now()
        
        # Date extraction regex (e.g. 14-Sep-24, 14/09/2024, 2024-09-14)
        date_match = re.search(r'(\d{1,2}[-/\.](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2})[-/\.]\d{2,4})', text, re.IGNORECASE)
        time_match = re.search(r'(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)', text, re.IGNORECASE)

        dt_str = ""
        if date_match:
            dt_str += date_match.group(1) + " "
        if time_match:
            dt_str += time_match.group(1)
            
        if dt_str.strip():
            try:
                # Try common formats
                for fmt in [
                    "%d-%b-%y %I:%M %p", "%d-%b-%Y %I:%M %p", "%d-%b-%y %H:%M:%S", "%d/%m/%Y %I:%M:%S %p",
                    "%d/%m/%Y %H:%M", "%d-%m-%Y %H:%M", "%Y-%m-%d %H:%M:%S", "%d-%b-%y", "%d/%m/%Y"
                ]:
                    try:
                        parsed_dt = datetime.strptime(dt_str.strip(), fmt)
                        break
                    except ValueError:
                        pass
            except Exception:
                pass

        return {
            'raw_sms': text,
            'amount': amount,
            'type': tx_type,
            'merchant': merchant,
            'payment_mode': payment_mode,
            'timestamp': parsed_dt,
            'is_parsed': amount > 0
        }

    @classmethod
    def parse_batch_sms(cls, sms_list: list) -> pd.DataFrame:
        """Parses a list of SMS texts into a Pandas DataFrame."""
        parsed_data = []
        for sms in sms_list:
            if sms and isinstance(sms, str) and sms.strip():
                parsed_data.append(cls.parse_single_sms(sms))
        
        df = pd.DataFrame(parsed_data)
        if not df.empty and 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['date'] = df['timestamp'].dt.date
            df['time'] = df['timestamp'].dt.time
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.day_name()
            df['is_weekend'] = df['timestamp'].dt.dayofweek >= 5
        return df
