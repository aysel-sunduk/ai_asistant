import re

# Yaygın yemek terimleri için kapsamlı bir sözlük
FOOD_TRANSLATIONS = {
    # Proteins
    'chicken': 'tavuk',
    'beef': 'dana eti',
    'pork': 'domuz eti',
    'fish': 'balık',
    'salmon': 'somon',
    'tuna': 'ton balığı',
    'shrimp': 'karides',
    'turkey': 'hindi',
    'lamb': 'kuzu eti',
    'egg': 'yumurta',
    'eggs': 'yumurta',
    'tofu': 'tofu',
    'lentil': 'mercimek',
    'beans': 'fasulye',
    'chickpea': 'nohut',
    'steak': 'antrikot/bonfile',
    'meatball': 'köfte',
    'meatballs': 'köfte',
    'mince': 'kıyma',
    'liver': 'ciğer',
    
    # Vegetables
    'tomato': 'domates',
    'potato': 'patates',
    'potatoes': 'patates',
    'onion': 'soğan',
    'garlic': 'sarımsak',
    'spinach': 'ıspanak',
    'broccoli': 'brokoli',
    'carrot': 'havuç',
    'cucumber': 'salatalık',
    'lettuce': 'marul',
    'cabbage': 'lahana',
    'pepper': 'biber',
    'mushroom': 'mantar',
    'zucchini': 'kabak',
    'eggplant': 'patlıcan',
    'corn': 'mısır',
    'peas': 'bezelye',
    'asparagus': 'kuşkonmaz',
    'cauliflower': 'karnabahar',
    'artichoke': 'enginar',
    'artichokes': 'enginar',
    'celery': 'kereviz',
    'kale': 'kale lahanası',
    'arugula': 'roka',
    'basil': 'fesleğen',
    'parsley': 'maydanoz',
    'dill': 'dereotu',
    'mint': 'nane',
    'thyme': 'kekik',
    
    # Fruits
    'apple': 'elma',
    'banana': 'muz',
    'orange': 'portakal',
    'strawberry': 'çilek',
    'blueberry': 'yaban mersini',
    'lemon': 'limon',
    'grape': 'üzüm',
    'avocado': 'avokado',
    'peach': 'şeftali',
    'cherry': 'kiraz',
    
    # Grains/Carbs
    'rice': 'pirinç',
    'pasta': 'makarna',
    'bread': 'ekmek',
    'oat': 'yulaf',
    'oatmeal': 'yulaf ezmesi',
    'quinoa': 'kinoa',
    'flour': 'un',
    'wheat': 'buğday',
    'noodles': 'erişte',
    'spaghetti': 'spagetti',
    'macaroni': 'makarna',
    'bulgur': 'bulgur',
    'barley': 'arpa',
    
    # Dairy
    'milk': 'süt',
    'cheese': 'peynir',
    'yogurt': 'yoğurt',
    'butter': 'tereyeğı',
    'cream': 'krema',
    'creamy': 'kremalı',
    'ricotta': 'rikotta peyniri',
    'mozzarella': 'mozzarella',
    'parmesan': 'parmesan',
    'cheddar': 'çedar',
    
    # Meats / Deli
    'prosciutto': 'füme et/prosciutto',
    'bacon': 'pastırma/füme et',
    'ham': 'jambon',
    'sausage': 'sosis/sucuk',
    'salami': 'selam',
    
    # Cooking Methods / Prep
    'roasted': 'fırınlanmış',
    'baked': 'fırında',
    'fried': 'kızarmış',
    'grilled': 'ızgara',
    'steamed': 'buharda',
    'boiled': 'haşlanmış',
    'stuffed': 'dolma/doldurulmuş',
    'slow cooker': 'ağır ateşte',
    'quick': 'pratik',
    'easy': 'kolay',
    'crispy': 'çıtır',
    'spicy': 'baharatlı',
    'sweet': 'tatlı',
    'marinated': 'marine edilmiş',
    'raw': 'çiğ',
    'fresh': 'taze',
    'sautéed': 'sotelenmiş',
    'poached': 'çılbır/haşlanmış',
    'mashed': 'ezilmiş/püre',
    
    # Common Meal Names
    'soup': 'çorbası',
    'salad': 'salatası',
    'stew': 'yahnisi',
    'curry': 'köri',
    'sandwich': 'sandviç',
    'burger': 'burger',
    'pizza': 'pizzası',
    'pie': 'pay/börek',
    'cake': 'kek',
    'cookies': 'kurabiye',
    'pancake': 'pankek',
    'pancakes': 'pankek',
    'waffle': 'vafıl',
    'muffin': 'muffin',
    'smoothie': 'smoothie',
    'bowl': 'kasesi',
    'sauce': 'sos',
    'dip': 'dip sos',
    'dressing': 'sos',
    'puree': 'püresi',
    'kebab': 'kebabı',
    'kebabs': 'kebabı',
    'dhal': 'mercimek yemeği (dhal)',
    'dal': 'mercimek yemeği (dal)',
    'curries': 'köriler',
    'omelette': 'omlet',
    'scrambled': 'çırpılmış',
    
    # Connection words
    'with': 'ile',
    'and': 've',
    'in': 'içinde',
    'style': 'usulü',
}

# Kelime bazlı çeviri için regex kalıbı
WORD_PATTERN = re.compile(r'\b(' + '|'.join(re.escape(k) for k in FOOD_TRANSLATIONS.keys()) + r')\b', re.IGNORECASE)

def translate_food_name(name_en: str) -> str:
    """Yemek ismini basit kurallar ve sözlük ile çevirir."""
    if not name_en:
        return ""
        
    # Küçük harfe çevir ve temizle
    text = name_en.lower().strip()
    
    # Özel durumlar: "Chicken Soup" -> "Tavuk Çorbası" (daha doğal çeviri için ters çevirme gerekebilir)
    # Ama şimdilik basit bir kelime bazlı çeviri yapalım
    
    def replace_match(match):
        word = match.group(0).lower()
        return FOOD_TRANSLATIONS.get(word, word)
    
    tr_name = WORD_PATTERN.sub(replace_match, text)
    
    # "With" yapısını düzelt (ör: "chicken with rice" -> "pirinç ile tavuk" yerine "tavuk ile pirinç" şimdilik idare eder)
    # Daha gelişmiş kurallar eklenebilir
    
    # Baş harfleri büyüt
    return " ".join([w.capitalize() for w in tr_name.split()])

if __name__ == "__main__":
    test_names = [
        "Roasted Chicken with Potatoes",
        "Creamy Tomato Soup",
        "Apple and Banana Smoothie",
        "Grilled Salmon with Asparagus"
    ]
    for n in test_names:
        print(f"{n} -> {translate_food_name(n)}")
