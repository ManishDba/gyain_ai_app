const WORD_VARIANTS = 
{
  "urea": [
    "aura","yuya", "area", "ur ea", "you rea", "yuria", "uria", "uriya",
    "uriea", "yurea", "uriaa", "ureya", "arya", "uriah", "eureka",
    "yureya", "urrea", "ureaa", "oorea", "ooriya", "yuree", "yureah",
    "yuriaa", "uriyah", "uryah", "uryia", "yuriah", "ureeya", "ureeyah",
    "yoorea", "yooriya", "yooreah", "ureaah", "you are", "your ear","oriyao","oriyao","oriya",
    "uyya","yaya","yeriya","yaariyan","yuri"
  ],
  "nano urea": [
    "nanua","nanu yuya" ,"naino yaya","naino oriya","nainon urea","nainon oriya","naino oriyao","naina urea",
    "naino yeriya","naino yaariyan","nano yuri","naanu yariya"
  ],
  "nano": [
    "nanu", "nau", "now", "know", "nao", "naow", "na no", "nanno",
    "neno", "kno", "naw", "gnaw", "naano", "nyano", "nenu", "knau",
    "nauh", "nah no","naino","naino","nainon","nainon","naino","naina"
  ],
  "DAP": [
    "d a p", "dee a pee", "deep", "dipp", "dape", "dapp", "dep",
    "daap", "dap", "dip", "daab", "dab", "dop", "dup", "thap",
    "dp", "the ap", "day p"
  ],
  "IFFCO": [
    "if co", "ifco", "if go", "efico", "ifko", "iffko", "if cow",
    "eifco", "iphco", "ipco", "if ko", "ifpco", "ifo", "i f c o",
    "inco", "eco", "if so", "ico", "Isco", "IFO", "ICO","isco","ifsco"
  ],
  "zinc": [
    "sink", "zink", "sing", "jink", "sinc", "jing", "zing", "think",
    "jinc", "sinck", "jhinc", "singh", "sin c", "jin c"
  ],
  "copper": [
    "coper", "koper", "copar", "kapper", "coppar", "kappa", "cop per", "ka per"
  ],
  "nitrogen": [
    "nitrozen", "nitrojen", "night rojan", "nit rojan", "nightrogen"
  ],
  "fertiliser": [
    "fertilizer", "furtilizer", "fartilizer", "fertlizer", "fert lizer"
  ],
  "fertilisers": [
    "fertilizers"
  ],
  "Kalol": [
    "kalool", "kelol", "kalal", "colol", "kaloal", "kollol", "kaalol",
    "kalo", "ka lol", "cal ol"
  ],
  "Aonla": [
    "onla", "ownla", "aonala", "aamla", "awnla", "ola", "aunla",
    "amla", "a on la", "own la"
  ],
  "Phulpur": [
    "fulpur", "phoolpur", "fullpur", "phulphur", "foolpur", "fulpoor",
    "full poor", "fool poor", "full for"
  ],
  "YOY": [
    "yoy", "y o y", "year on year", "yo y", "why oh why", "year over year"
  ],
  "DGM": [
    "dgm", "d g m", "dee gee em", "dee jee em"
  ],
  "SMM": [
    "smm", "s m m", "ess em em", "sam", "es em em"
  ],
  "GM": [
    "gm", "g m", "jee em", "gem", "zm"
  ],
  "RGB": [
    "rgb", "r g b", "are gee bee", "ar ji bi"
  ],
  "FCO": [
    "fco", "f c o", "ef see oh", "ef si o"
  ],
  "EMD": [
    "emd", "e m d", "ee em dee", "i am di"
  ],
  "BG": [
    "bg", "b g", "bee gee", "bee ji"
  ],
  "NFP": [
    "nfp", "n f p", "en ef pee", "an af pi"
  ],
  "UP": [
    "up", "u p", "you pee", "yup", "ub", "uttar pradesh", "oop",
    "yoo pee", "utter pradesh"
  ],
  "MP": [
    "mp", "m p", "em pee", "madhya pradesh", "madya pradesh", "madhyapradesh"
  ],
  "HR": [
    "hr", "h r", "aitch are", "haryana", "hariyana", "heryana"
  ],
  "Rajasthan": [
    "rajasthan", "rajsthan", "rajasthaan", "rajstan", "rajastan", "rajashthan"
  ],
  "Bihar": [
    "bihar", "biher", "bihaar", "behar"
  ],
  "Tamil Nadu": [
    "tamil nadu", "tamilnadu", "tamil naadu", "tamilnaadu", "tameel nadu"
  ],
  "Chattisgarh": [
    "chattisgarh", "chhattisgarh", "chatisgarh", "chhatisgarh", "chattisgar"
  ],
  "Punjab": [
    "punjab", "panjab", "punjaab"
  ],
  "Gujarat": [
    "gujarat", "gujrat", "gujaarat"
  ],
  "Maharashtra": [
    "maharashtra", "maharastra", "mahrastra"
  ],
  "Karnataka": [
    "karnataka", "karnatak", "karnataaka"
  ],
  "Andhra Pradesh": [
    "andhra pradesh", "andra pradesh", "andhrapradesh", "andrapradesh"
  ],
  "Kanpur": [
    "kanpur", "kanpoor", "cawnpore", "kanpor", "kanpour", "kaanpur"
  ],
  "Lucknow": [
    "lucknow", "lukhnow", "laknow", "lucknau", "luknow", "lakhnau"
  ],
  "Agra": [
    "agra", "aagra", "aagara", "agara"
  ],
  "dispatch": [
    "despatch", "despatched"
  ],
  "quantity": [
    "qty", "qnty", "quentity"
  ],
  "production": [
    "producton", "producion"
  ],
  "stock": [
    "stok", "stoke"
  ],
  "sales": [
    "sails", "sells", "sail", "sale"
  ],
  "target": [
    "targate", "targat", "targett"
  ],
  "foliar": [
    "folier", "foliya", "foliyar", "follier", "foliaar", "foliyaar", "foyer"
  ],
  "spray": [
    "sprey", "spary", "spry", "ispray", "isprey"
  ],
  "dosage": [
    "dosege", "dosej", "doze", "doosage", "dosige"
  ],
  "hectare": [
    "hector", "hecktare", "hectar", "hektar", "hectaar", "hektaar"
  ],
  "acre": [
    "aker", "akre", "acer", "ekar", "aacer", "per eckerd"
  ],
  "bottle": [
    "botle", "bottel", "bottl", "botal", "bottal", "bottol"
  ],
  "litre": [
    "liter", "leeter", "ltr", "litar", "leetar"
  ],
  "Sugarcane": [
    "sugarcane", "suger cane", "sugar cane", "sugarcain", "sugarcan", "ganna"
  ],
  "Banana": [
    "banana", "bannana", "banan", "bananas", "kela", "keyla"
  ],
  "wheat": [
    "wheet", "weat", "gehun", "gehoon"
  ],
  "rice": [
    "rais", "rise", "dhan", "chaaval"
  ],
  "cotton": [
    "coton", "cotten", "kapas", "kapaas", "cartoon"
  ],
  "Bajra": [
    "bajra", "bajara", "bajira", "pearl millet", "bajaura", "bara"
  ],
  "Jowar": [
    "jowar", "jwar", "jowaar", "sorghum"
  ],
  "onion": [
    "onyon", "unyun", "pyaaz", "piyaz"
  ],
  "tomato": [
    "tamato", "tomatto", "tamatar", "tamaatar"
  ],
  "pulses": [
    "puls", "pulse", "daal", "dal"
  ],
  "potato": [
    "aloo", "aaloo", "patato"
  ],
  "chilli": [
    "chili", "mirchi", "mirch"
  ],
  "trials": [
    "tryals", "triles", "triels"
  ],
  "yield": [
    "yeild", "yeld", "yeeld"
  ],
  "percentage": [
    "percent", "persent"
  ],
  "increase": [
    "increse", "increese"
  ],
  "growth": [
    "groth", "growt"
  ],
  "month wise": [
    "monthwise", "month vise", "month waiz", "monthwaiz", "month voice"
  ],
  "year wise": [
    "yearwise", "year vise", "year waiz", "saal wise", "your voice",
    "ear wise", "year voice"
  ],
  "year": [
    "air"
  ],
  "state wise": [
    "statewise", "state vise", "state waiz", "rajya wise", "state voice", "Statewide"
  ],
  "district wise": [
    "districtwise", "district vise", "jila wise", "jilla wise", "district voice"
  ],
  "plant wise": [
    "plantwise", "plant vise", "plant voice"
  ],
  "product wise": [
    "productwise", "product vise", "product voice"
  ],
  "crop wise": [
    "cropwise", "fasal wise", "crop voice"
  ],
  "wise": [
    "wide", "wire"
  ],
  "top 10": [
    "top ten", "top tin"
  ],
  "bottom 10": [
    "bottom ten"
  ],
  "total": [
    "totall", "totle"
  ],
  "count": [
    "kount"
  ],
  "details": [
    "detail", "ditails"
  ],
  "highest": [
    "higest", "hyest"
  ],
  "lowest": [
    "lowst", "loest"
  ],
  "director": [
    "directer", "directar"
  ],
  "board": [
    "bord", "borad"
  ],
  "approval": [
    "aproval", "approvel"
  ],
  "purchase": [
    "purchas", "perchase"
  ],
  "supplier": [
    "suplier", "supp lier"
  ],
  "delegation": [
    "delegasion"
  ],
  "powers": [
    "power", "powars"
  ],
  "employee": [
    "employe", "employi"
  ],
  "employees": [
    "employes"
  ],
  "manpower": [
    "man power", "menpower"
  ],
  "strength": [
    "strenth", "strenght"
  ],
  "grade": [
    "gred", "grayed"
  ],
  "department": [
    "departmant", "depart"
  ],
  "retirement": [
    "retire", "retairment"
  ],
  "retiring": [
    "retireing"
  ],
  "extension": [
    "extention", "extansion"
  ],
  "lien": [
    "lean", "lion", "leen"
  ],
  "birthday": [
    "birth", "birth day"
  ],
  "birthdate": [
    "birth date"
  ],
  "DOB": [
    "dob", "d o b", "date of birth"
  ],
  "DOJ": [
    "doj", "d o j", "date of joining"
  ],
  "DOR": [
    "dor", "d o r", "date of retirement"
  ],
  "hometown": [
    "home town", "hometon"
  ],
  "status": [
    "staus", "satus"
  ],
  "active": [
    "activ", "aktive"
  ],
  "regular": [
    "reguler", "regualar"
  ],
  "January": [
    "january", "januray", "janaury"
  ],
  "February": [
    "february", "febraury", "feb"
  ],
  "March": [
    "march", "marh"
  ],
  "April": [
    "april", "aprl", "aprial"
  ],
  "May": [
    "may"
  ],
  "June": [
    "june", "jun"
  ],
  "July": [
    "july", "julai"
  ],
  "August": [
    "august", "agust", "aguest"
  ],
  "September": [
    "september", "septembar", "sept"
  ],
  "October": [
    "october", "octobr", "oct"
  ],
  "November": [
    "november", "novembar", "nov"
  ],
  "December": [
    "december", "decembar", "dec"
  ],
  "F&A": [
    "f and a", "f & a", "finance and accounts"
  ],
  "Finance": [
    "finance", "finence", "fynance"
  ],
  "Accounts": [
    "accounts", "acount"
  ],
  "Marketing": [
    "marketing", "marketting", "markating"
  ],
  "HO": [
    "head office", "head quarters", "headquarters", "ho", "h o"
  ],
  "unit": [
    "uneet", "yunit"
  ],
  "L1": [
    "l1", "l 1", "el one"
  ],
  "L2": [
    "l2", "l 2", "el two"
  ],
  "L3": [
    "l3", "l 3", "el three"
  ],
  "G1": [
    "g1", "g 1", "jee one"
  ],
  "G2": [
    "g2", "g 2", "jee two"
  ],
  "G3": [
    "g3", "g 3", "jee three"
  ],
  "G4": [
    "g4", "g 4", "jee four"
  ],
  "G5": [
    "g5", "g 5", "jee five"
  ],
  "Kharif": [
    "kharif", "karif", "kha rif", "khalif"
  ],
  "Rabi": [
    "rabi", "rabbi", "ra bi"
  ],
  "season": [
    "seson", "sezon"
  ],
  "performer": [
    "performar", "preformer"
  ],
  "performers": [
    "performars"
  ],
  "negative": [
    "negetive", "nagetive"
  ],
  "positive": [
    "positiv", "posative"
  ],
  "improvement": [
    "improvment", "imrovement"
  ],
  "JIFCO": [
    "jifco", "j i f c o", "jifko"
  ],
  "OMIFCO": [
    "omifco", "o m i f c o"
  ],
  "KIT": [
    "kit", "k i t"
  ],
  "current": [
    "curent", "currant"
  ],
  "previous": [
    "previos", "previeus"
  ],
  "last": [
    "lust", "laast"
  ],
  "next": [
    "nxt", "nex"
  ],
  "completed": [
    "complited", "completd"
  ],
  "years": [
    "yrs"
  ],
  "service": [
    "servise", "sarvis"
  ],
  "1": [
    "one"
  ],
  "2": [
    "two"
  ],
  "3": [
    "three"
  ],
  "4": [
    "four"
  ],
  "5": [
    "five"
  ],
  "6": [
    "six"
  ],
  "7": [
    "seven"
  ],
  "8": [
    "eight"
  ],
  "9": [
    "nine"
  ],
  "10": [
    "ten"
  ],
  "quotation": [
    "qutation", "quotasion"
  ],
  "tender": [
    "tendar", "tander"
  ],
  "proprietary": [
    "proprietry", "propritary"
  ],
  "guarantee": [
    "guarante", "gaurantee"
  ],
  "demurrage": [
    "demurage", "demuraj"
  ],
  "godown": [
    "godawn", "godam"
  ],
  "expenditure": [
    "expnditure", "expendeture"
  ],
  "advance": [
    "advans", "edvance"
  ],
  "payment": [
    "paymant", "payement"
  ],
  "compensatory": [
    "compensatry"
  ],
  "sanctioning": [
    "sanction", "sankshan"
  ],
  "audit": [
    "adit", "audeet"
  ],
  "allotment": [
    "alotment", "allotmant"
  ],
  "laptop": [
    "leptop", "labtop"
  ],
  "mobile": [
    "mobil", "moble"
  ],
  "phone": [
    "fone", "phon"
  ],
  "domestic": [
    "domastic", "domestik"
  ],
  "international": [
    "intarnational"
  ],
  "tour": [
    "toor", "toar"
  ],
  "travel": [
    "trevel", "traval"
  ],
  "gifts": [
    "gift", "gifat"
  ],
  "salary": [
    "salery", "sallary"
  ],
  "policy": [
    "polisy", "polici"
  ],
  "colony": [
    "coloni", "kolony"
  ],
  "housing": [
    "house", "housinng"
  ],
  "capital": [
    "capitel", "kapitl"
  ],
  "revenue": [
    "revenu", "revenew"
  ],
  "lakhs": [
    "lakh", "lacs", "lac"
  ],
  "crore": [
    "crores", "karor"
  ],
  "thousand": [
    "thausand", "thousnd"
  ],
  "rupees": [
    "rupee", "rupaye", "rupay"
  ],
  "Rs": [
    "rs", "r s"
  ],
  "flowering": [
    "flowring", "flawering"
  ],
  "tillering": [
    "tilering", "tailoring", "thrilling"
  ],
  "seedling": [
    "seadling", "sidling"
  ],
  "drip": [
    "deep", "dreep"
  ],
  "irrigation": [
    "irrisation", "irrigasion"
  ],
  "soil": [
    "soyal", "soyl"
  ],
  "moisture": [
    "moischar", "moistur"
  ],
  "specification": [
    "specificasion"
  ],
  "certification": [
    "sertification"
  ],
  "manufacturing": [
    "menufacturing"
  ],
  "capacity": [
    "capasity", "kepacity"
  ],
  "efficiency": [
    "efficiancy", "eficiency"
  ],
  "daily": [
    "dailly", "daly"
  ],
  "weekly": [
    "weakly", "weekely"
  ],
  "monthly": [
    "monthaly", "montly"
  ],
  "yearly": [
    "yarly"
  ],
  "annual": [
    "anual", "annuwal"
  ],
  "today": [
    "toady"
  ],
  "yesterday": [
    "yestarday", "yasterday"
  ],
  "tomorrow": [
    "tommorow", "tomarrow"
  ],
  "show": [
    "sho", "shw"
  ],
  "list": [
    "lest", "leest"
  ],
  "display": [
    "disply", "dispaly"
  ],
  "compare": [
    "compar", "compair"
  ],
  "comparison": [
    "comparision"
  ],
  "calculate": [
    "calculat", "calulate"
  ],
  "compute": [
    "compyut", "cumpute"
  ],
  "summarize": [
    "summarise", "summerize"
  ],
  "analyze": [
    "analyse", "analyz"
  ],
  "between": [
    "betwean", "bitween"
  ],
  "among": [
    "amoung", "amongh"
  ],
  "vs": [
    "versus", "v s", "verse"
  ],
  "difference": [
    "differance", "difrence"
  ],
  "similar": [
    "similer", "simillar"
  ],
  "same": [
    "sam", "saim"
  ],
  "different": [
    "diferent", "diffrent"
  ],
  "cereals": [
    "serials"
  ],
  "allot": [
    "alert", "a loat"
  ],
  "bidding": [
    "building"
  ],
  "bid": [
    "bed"
  ],
  "lien": [
    "line","len","lie","lean"
  ]
}
export default WORD_VARIANTS;