import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
import re
import os

class ToyotaCarRAG:
    """
    RAG (Retrieval-Augmented Generation) system for Toyota car recommendations.
    Searches through CSV data and returns relevant car matches.
    """
    
    def __init__(self, csv_path: str = "Toyota_price_table.csv"):
        """
        Initialize the RAG system with Toyota car data
        
        Args:
            csv_path: Path to the Toyota price table CSV
        """
        # Load CSV data
        self.df = pd.read_csv(csv_path)
        
        # Clean data - remove rows with missing essential fields
        self.df = self.df.dropna(subset=['Entry_price', 'Year', 'Genmodel'])
        
        # Create model type mapping (infer from model names)
        self.model_type_map = self._create_model_type_map()
        
        print(f"✅ ToyotaCarRAG initialized with {len(self.df)} vehicles")
    
    def _create_model_type_map(self) -> Dict[str, str]:
        """Create a mapping of model names to body types"""
        model_type_map = {
            # SUVs
            'RAV4': 'SUV',
            'Highlander': 'SUV',
            '4Runner': 'SUV',
            'Land Cruiser': 'SUV',
            'Sequoia': 'SUV',
            'Venza': 'SUV',
            'C-HR': 'SUV',
            
            # Sedans
            'Camry': 'Sedan',
            'Corolla': 'Sedan',
            'Avalon': 'Sedan',
            'Yaris': 'Sedan',
            'Prius': 'Sedan',
            
            # Trucks
            'Tundra': 'Truck',
            'Tacoma': 'Truck',
            
            # Minivans
            'Sienna': 'Minivan',
            
            # Sports Cars
            'GT86': 'Sports Car',
            'Supra': 'Sports Car',
            
            # Hatchbacks
            'AYGO': 'Hatchback',
        }
        return model_type_map
    
    def _infer_body_type(self, model_name: str) -> str:
        """Infer body type from model name"""
        model_name_upper = model_name.upper()
        for key, body_type in self.model_type_map.items():
            if key.upper() in model_name_upper:
                return body_type
        return 'Unknown'
    
    def _extract_price_range(self, query: str) -> Optional[tuple]:
        """Extract price range from user query"""
        query_lower = query.lower()
        
        # Handle "cheap" or "affordable" without specific numbers
        if any(word in query_lower for word in ['cheap', 'affordable', 'budget', 'inexpensive']):
            if not re.search(r'\d+', query_lower):
                # No specific number, return cheapest 30%
                max_price = self.df['Entry_price'].quantile(0.3)
                return (0, max_price)
        
        # Enhanced patterns for price extraction
        # Range patterns (check first)
        range_patterns = [
            (r'between\s*\$?\s*(\d+)[,.]?(\d*)\s*k?\s*and\s*\$?\s*(\d+)[,.]?(\d*)\s*k?', True),
            (r'\$?\s*(\d+)[,.]?(\d*)\s*k?\s*-\s*\$?\s*(\d+)[,.]?(\d*)\s*k?', True),
        ]
        
        for pattern, is_range in range_patterns:
            match = re.search(pattern, query_lower)
            if match:
                groups = match.groups()
                min_str = (groups[0] or '') + (groups[1] or '')
                max_str = (groups[2] or '') + (groups[3] or '')
                
                if min_str and max_str:
                    min_val = int(min_str)
                    max_val = int(max_str)
                    
                    if 'k' in match.group(0).lower() or min_val < 1000:
                        min_val *= 1000
                        max_val *= 1000
                    
                    return (min_val, max_val)
        
        # Single value patterns
        single_patterns = [
            r'under\s*\$?\s*(\d+)[,.]?(\d*)\s*k?',
            r'below\s*\$?\s*(\d+)[,.]?(\d*)\s*k?',
            r'less than\s*\$?\s*(\d+)[,.]?(\d*)\s*k?',
            r'up to\s*\$?\s*(\d+)[,.]?(\d*)\s*k?',
            r'\$?\s*(\d+)[,.]?(\d*)\s*k?\s*or less',
            r'around\s*\$?\s*(\d+)[,.]?(\d*)\s*k?',
            r'about\s*\$?\s*(\d+)[,.]?(\d*)\s*k?',
            r'\$\s*(\d{1,3}),?(\d{3})',
        ]
        
        for pattern in single_patterns:
            match = re.search(pattern, query_lower)
            if match:
                groups = match.groups()
                price_str = ''.join(g for g in groups if g)
                
                if price_str:
                    price = int(price_str)
                    match_text = match.group(0).lower()
                    if 'k' in match_text or (price < 1000 and 'k' not in match_text and price < 100):
                        price *= 1000
                    
                    return (0, price)
        
        return None
    
    def _extract_year(self, query: str) -> Optional[int]:
        """Extract year from user query"""
        year_pattern = r'\b(20\d{2})\b'
        match = re.search(year_pattern, query)
        if match:
            year = int(match.group(1))
            if 2000 <= year <= 2099:
                return year
        return None
    
    def _extract_keywords(self, query: str) -> Dict[str, Any]:
        """Extract keywords from user query"""
        query_lower = query.lower()
        keywords = {
            'body_types': [],
            'features': [],
            'use_cases': [],
            'model_names': [],
            'year': None,
        }
        
        # Extract year
        keywords['year'] = self._extract_year(query)
        
        # Body type keywords
        body_type_keywords = {
            'sedan': ['sedan', 'car'],
            'suv': ['suv', 'suvs', 'sport utility', 'sport-utility', 'sport utility vehicle', 'crossover', 'cross-over'],
            'truck': ['truck', 'trucks', 'pickup', 'pick-up', 'pickup truck'],
            'hatchback': ['hatchback', 'hatch-back', 'hatch'],
            'sports car': ['sports car', 'sportscar', 'sporty car'],
        }
        
        for body_type, terms in body_type_keywords.items():
            for term in terms:
                pattern = r'\b' + re.escape(term) + r'\b'
                if re.search(pattern, query_lower):
                    model_names_after = ['rav4', 'corolla', 'camry', 'prius', 'yaris']
                    term_pos = query_lower.find(term)
                    if term_pos != -1:
                        text_after = query_lower[term_pos + len(term):term_pos + len(term) + 5].strip()
                        is_part_of_model = any(model in text_after for model in model_names_after)
                        if not is_part_of_model:
                            keywords['body_types'].append(body_type)
                            break
        
        # Feature keywords
        feature_keywords = {
            'fuel efficient': ['fuel efficient', 'good gas mileage', 'mpg', 'economy', 'efficient'],
            'hybrid': ['hybrid', 'electric', 'ev', 'plug-in'],
            'awd': ['awd', 'all wheel drive', '4wd', 'four wheel drive'],
            'spacious': ['spacious', 'roomy', 'large', 'big'],
            'luxury': ['luxury', 'premium', 'high-end', 'nice'],
            'family': ['family', 'kids', 'children', 'safe'],
            'reliable': ['reliable', 'dependable', 'durable'],
        }
        
        for feature, terms in feature_keywords.items():
            if any(term in query_lower for term in terms):
                keywords['features'].append(feature)
        
        # Use case keywords
        use_case_keywords = {
            'commuting': ['commute', 'daily', 'work', 'driving to work'],
            'family': ['family', 'kids', 'children'],
            'off-road': ['off-road', 'off road', 'camping', 'outdoor'],
            'cargo': ['cargo', 'hauling', 'towing', 'luggage'],
        }
        
        for use_case, terms in use_case_keywords.items():
            if any(term in query_lower for term in terms):
                keywords['use_cases'].append(use_case)
        
        # Model name detection
        model_names = [
            'Land Cruiser Amazon',
            'Land Cruiser',
            '4Runner',
            'RAV4',
            'C-HR',
            'GT86',
            'Camry', 'Corolla', 'Highlander', 'Tundra', 'Tacoma', 
            'Prius', 'Avalon', 'Sequoia', 'Yaris', 'Supra', 
            'AYGO', 'Venza', 'Sienna'
        ]
        
        matched_models = []
        
        for model in model_names:
            is_covered = any(model in matched and len(model) < len(matched) for matched in matched_models)
            if is_covered:
                continue
                
            if model == '4Runner':
                pattern = r'\b4runner\b|\b4-runner\b'
            elif model == 'RAV4':
                pattern = r'\brav4\b|\brav\s*4\b'
            elif model == 'Land Cruiser':
                pattern = r'\bland\s+cruiser\b(?!\s+amazon)'
            elif model == 'Land Cruiser Amazon':
                pattern = r'\bland\s+cruiser\s+amazon\b'
            elif model == 'C-HR':
                pattern = r'\bc-hr\b|\bchr\b'
            else:
                pattern = r'\b' + re.escape(model.lower()) + r'\b'
            
            if re.search(pattern, query_lower, re.IGNORECASE):
                matched_models = [m for m in matched_models if m not in model or len(m) >= len(model)]
                if model not in matched_models:
                    matched_models.append(model)
        
        keywords['model_names'] = matched_models
        
        return keywords
    
    def search_cars(self, user_query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search through CSV data based on user requirements
        
        Args:
            user_query: User's query string
            limit: Maximum number of results to return
            
        Returns:
            List of matched car dictionaries
        """
        working_df = self.df.copy()
        
        # Extract price range
        price_range = self._extract_price_range(user_query)
        
        # Extract keywords
        keywords = self._extract_keywords(user_query)
        
        # Add body_type column for all cars
        working_df['body_type'] = working_df['Genmodel'].apply(self._infer_body_type)
        
        # Calculate relevance scores
        working_df['relevance_score'] = 0
        
        # Base score: prefer newer models
        if len(working_df) > 0:
            max_year = working_df['Year'].max()
            min_year = working_df['Year'].min()
            if max_year > min_year:
                recent_cars = working_df['Year'] >= (max_year - 5)
                working_df.loc[recent_cars, 'relevance_score'] += 15
                older_cars = working_df['Year'] < (max_year - 5)
                working_df.loc[older_cars, 'relevance_score'] += ((working_df.loc[older_cars, 'Year'] - min_year) / (max_year - min_year)) * 8
        
        # Base score: prefer lower mileage
        if 'mileage' in working_df.columns and len(working_df) > 0:
            low_mileage = working_df['mileage'] <= 100000
            medium_mileage = (working_df['mileage'] > 100000) & (working_df['mileage'] <= 200000)
            high_mileage = working_df['mileage'] > 200000
            
            working_df.loc[low_mileage, 'relevance_score'] += 15
            working_df.loc[medium_mileage, 'relevance_score'] += 5
            working_df.loc[high_mileage, 'relevance_score'] -= 5
        
        # Price filtering
        if price_range:
            min_price, max_price = price_range
            in_range = (working_df['Entry_price'] >= min_price) & (working_df['Entry_price'] <= max_price)
            working_df.loc[in_range, 'relevance_score'] += 60
            slightly_over = (working_df['Entry_price'] > max_price) & (working_df['Entry_price'] <= max_price * 1.2)
            slightly_under = (working_df['Entry_price'] < min_price) & (working_df['Entry_price'] >= min_price * 0.8)
            working_df.loc[slightly_over | slightly_under, 'relevance_score'] -= 10
            far_out_of_range = (working_df['Entry_price'] > max_price * 1.2) | (working_df['Entry_price'] < min_price * 0.8)
            working_df.loc[far_out_of_range, 'relevance_score'] -= 40
        else:
            median_price = working_df['Entry_price'].median()
            price_diff = abs(working_df['Entry_price'] - median_price)
            max_diff = price_diff.max()
            if max_diff > 0:
                within_reasonable_range = price_diff <= (median_price * 0.5)
                working_df.loc[within_reasonable_range, 'relevance_score'] += 8
                working_df.loc[~within_reasonable_range, 'relevance_score'] -= 5
        
        # Year and body type matching
        year_specified = keywords.get('year') is not None
        body_type_specified = len(keywords['body_types']) > 0
        
        if year_specified:
            target_year = keywords['year']
            year_exact_match = working_df['Year'] == target_year
            year_close_match = (abs(working_df['Year'] - target_year) <= 2) & ~year_exact_match
            year_far = abs(working_df['Year'] - target_year) > 2
            
            if body_type_specified:
                body_match = working_df['body_type'].isin(keywords['body_types'])
                perfect_match = year_exact_match & body_match
                working_df.loc[perfect_match, 'relevance_score'] += 100
                good_match = year_close_match & body_match
                working_df.loc[good_match, 'relevance_score'] += 60
                wrong_body_right_year = year_exact_match & ~body_match
                working_df.loc[wrong_body_right_year, 'relevance_score'] += 10
                right_body_wrong_year = body_match & year_far
                working_df.loc[right_body_wrong_year, 'relevance_score'] += 30
                wrong_body = ~body_match
                working_df.loc[wrong_body, 'relevance_score'] -= 40
            else:
                working_df.loc[year_exact_match, 'relevance_score'] += 50
                working_df.loc[year_close_match, 'relevance_score'] += 25
                working_df.loc[year_far, 'relevance_score'] -= 20
        
        # Body type matching
        if keywords['body_types'] and not year_specified:
            body_match = working_df['body_type'].isin(keywords['body_types'])
            working_df.loc[body_match, 'relevance_score'] += 50
            body_mismatch = ~body_match
            working_df.loc[body_mismatch, 'relevance_score'] -= 50
        elif not keywords['body_types'] and not year_specified and not price_range:
            popular_types = ['SUV', 'Sedan']
            body_match = working_df['body_type'].isin(popular_types)
            working_df.loc[body_match, 'relevance_score'] += 3
        
        # Model name matching
        if keywords['model_names']:
            for model in keywords['model_names']:
                exact_match = working_df['Genmodel'].str.lower() == model.lower()
                partial_match = working_df['Genmodel'].str.contains(model, case=False, na=False, regex=False) & ~exact_match
                working_df.loc[exact_match, 'relevance_score'] += 80
                working_df.loc[partial_match, 'relevance_score'] += 50
        
        # Feature-based boosts
        if any('hybrid' in f.lower() or 'electric' in f.lower() or 'ev' in f.lower() for f in keywords['features']):
            hybrid_models = ['Prius', 'RAV4', 'Highlander', 'Camry', 'Avalon', 'Venza']
            for model in hybrid_models:
                model_match = working_df['Genmodel'].str.contains(model, case=False, na=False, regex=False)
                working_df.loc[model_match, 'relevance_score'] += 25
        
        if any('fuel efficient' in f.lower() or 'economy' in f.lower() or 'mpg' in f.lower() or 'gas mileage' in f.lower() for f in keywords['features']):
            efficient_models = ['Prius', 'Corolla', 'Camry', 'Yaris', 'AYGO']
            for model in efficient_models:
                model_match = working_df['Genmodel'].str.contains(model, case=False, na=False, regex=False)
                working_df.loc[model_match, 'relevance_score'] += 20
            large_vehicles = working_df['body_type'].isin(['SUV', 'Truck'])
            working_df.loc[large_vehicles, 'relevance_score'] -= 15
        
        if any('family' in f.lower() or 'kids' in f.lower() or 'children' in f.lower() for f in keywords['features'] + keywords['use_cases']):
            family_models = ['Highlander', 'Sienna', 'RAV4', '4Runner', 'Sequoia', 'Venza']
            for model in family_models:
                model_match = working_df['Genmodel'].str.contains(model, case=False, na=False, regex=False)
                working_df.loc[model_match, 'relevance_score'] += 25
            suv_match = working_df['body_type'] == 'SUV'
            working_df.loc[suv_match, 'relevance_score'] += 15
        
        if any('spacious' in f.lower() or 'roomy' in f.lower() or 'large' in f.lower() or 'big' in f.lower() for f in keywords['features']):
            spacious_models = ['Highlander', 'Sequoia', 'Land Cruiser', '4Runner', 'Sienna']
            for model in spacious_models:
                model_match = working_df['Genmodel'].str.contains(model, case=False, na=False, regex=False)
                working_df.loc[model_match, 'relevance_score'] += 20
            small_cars = working_df['body_type'].isin(['Hatchback', 'Sedan'])
            small_models = working_df['Genmodel'].str.contains('Yaris|AYGO|iQ|Corolla', case=False, na=False, regex=True)
            working_df.loc[small_cars | small_models, 'relevance_score'] -= 20
        
        if any('truck' in bt.lower() or 'pickup' in bt.lower() or 'pick-up' in bt.lower() for bt in keywords['body_types'] + keywords['use_cases']):
            truck_models = ['Tundra', 'Tacoma']
            for model in truck_models:
                model_match = working_df['Genmodel'].str.contains(model, case=False, na=False, regex=False)
                working_df.loc[model_match, 'relevance_score'] += 30
            non_trucks = working_df['body_type'] != 'Truck'
            working_df.loc[non_trucks, 'relevance_score'] -= 30
        
        # Use case boosts
        if 'commuting' in keywords['use_cases']:
            commute_models = ['Corolla', 'Camry', 'Prius', 'Yaris', 'AYGO']
            for model in commute_models:
                model_match = working_df['Genmodel'].str.contains(model, case=False, na=False, regex=False)
                working_df.loc[model_match, 'relevance_score'] += 18
            commute_friendly = working_df['body_type'].isin(['Sedan', 'Hatchback'])
            working_df.loc[commute_friendly, 'relevance_score'] += 10
        
        if 'off-road' in keywords['use_cases']:
            offroad_models = ['4Runner', 'Land Cruiser', 'Tacoma', 'Tundra']
            for model in offroad_models:
                model_match = working_df['Genmodel'].str.contains(model, case=False, na=False, regex=False)
                working_df.loc[model_match, 'relevance_score'] += 25
            offroad_friendly = working_df['body_type'].isin(['SUV', 'Truck'])
            working_df.loc[offroad_friendly, 'relevance_score'] += 15
        
        # Sort by relevance score
        working_df = working_df.sort_values('relevance_score', ascending=False)
        
        # Filter out very low-scoring results
        if len(working_df) > 0:
            max_score = working_df['relevance_score'].max()
            min_acceptable_score = max_score * 0.3
            
            has_specific_criteria = year_specified or body_type_specified or price_range or keywords['model_names']
            if has_specific_criteria:
                min_acceptable_score = max_score * 0.4
                working_df = working_df[working_df['relevance_score'] >= min_acceptable_score]
            
            if len(working_df) > limit * 2:
                working_df = working_df.head(limit * 2)
        
        # Ensure we have results
        if len(working_df) == 0:
            print(f"⚠️ No highly relevant matches found, using broader search")
            working_df = self.df.copy()
            working_df['body_type'] = working_df['Genmodel'].apply(self._infer_body_type)
            working_df['relevance_score'] = 0
            max_year = working_df['Year'].max()
            min_year = working_df['Year'].min()
            if max_year > min_year:
                working_df['relevance_score'] += ((working_df['Year'] - min_year) / (max_year - min_year)) * 20
            working_df = working_df.sort_values('relevance_score', ascending=False)
        
        # Limit results
        results_df = working_df.head(limit)
        
        # Final safety check
        if len(results_df) == 0:
            print(f"❌ ERROR: No results after processing! Query: '{user_query}'")
            results_df = self.df.copy()
            results_df = results_df.sort_values('Year', ascending=False).head(limit)
        
        # Convert to list of dictionaries
        results = []
        for _, row in results_df.iterrows():
            car_dict = {
                'model': row['Genmodel'],
                'year': int(row['Year']) if pd.notna(row['Year']) else None,
                'price': float(row['Entry_price']) if pd.notna(row['Entry_price']) else None,
                'mileage': int(row['mileage']) if pd.notna(row['mileage']) else None,
                'image_url': row.get('Image_url', ''),
                'body_type': self._infer_body_type(row['Genmodel']),
                'maker': row.get('Maker', 'Toyota'),
            }
            results.append(car_dict)
        
        print(f"🔍 Search query: '{user_query}' -> Found {len(results)} cars")
        return results
    
    def generate_recommendations(
        self, 
        user_query: str, 
        matched_cars: List[Dict], 
        conversation_history: Optional[List[Dict]] = None
    ) -> str:
        """
        Return empty string - no text generation, just return matched cars
        
        Args:
            user_query: User's current query
            matched_cars: List of matched car dictionaries
            conversation_history: Optional conversation history (unused)
            
        Returns:
            Empty string (cars are returned separately)
        """
        # Return empty string - no AI text generation
        # Matched cars are returned separately in the API response
        return ""

