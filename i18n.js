// ============================================================
// Shared translations + language helpers
// Single source of truth for every page: the calculator
// (index.html / app.js) and the auth/history/compare/profile
// pages all import from here.
// Numbers always stay English; only text is translated.
// ============================================================

export const I18N = {
  en: {
    // common
    loading: 'Loading…',
    signIn: 'Sign In',
    close: 'Close', cancel: 'Cancel', save: 'Save', done: 'Done', edit: 'Edit',
    clear: 'Clear',
    mmk: 'MMK', perK: '/ K', perYt: '/ Yt',
    unitK: 'K', unitP: 'P', unitY: 'Y', unitYt: 'Yt',
    // menu
    optEditPrice: 'Edit Gold Price', optHistory: 'My History',
    optEditInfo: 'Edit My Info', optCompare: 'Compare Mode',
    ariaMenu: 'Menu', ariaBack: 'Back to calculator',
    ariaToggleTheme: 'Toggle theme', ariaPricing: 'Pricing', ariaCalculator: 'Calculator',
    ariaProfile: 'Profile',
    // item types
    typeGold: 'Gold', typeGoldGem: 'Gold + Gem', typeGoldDiamond: 'Gold + Diamond',
    // item names
    itemNamePill: 'ITEM NAME', itemNameLabel: 'Item Name', specificItem: 'Specific Item',
    itemRing: 'Ring', itemBracelet: 'Bracelet', itemEarrings: 'Earrings', itemPendant: 'Pendant',
    itemNecklace: 'Necklace',
    itemHandChain: 'Hand chain', itemFootChain: 'Foot chain', itemHairClipper: 'Hair clipper', itemOther: 'Other',
    // purity
    goldPurity: 'Gold Purity', quality: 'Gold Purity',
    quality16: '16K', quality15: '15K', quality145: '14.5K', quality14: '14K', quality12: '12K',
    // calculator (index.html / app.js)
    currentGoldPrice: 'CURRENT GOLD PRICE', itemTypePlaceholder: 'Item Type',
    itemWeight: 'Item Weight', lossWeight: 'Loss Weight',
    modeCalculate: 'Calculate', modeFixed: 'Fixed',
    gemWeight: 'Gem Weight', gemPrice: 'Gem Price', gemCost: 'Gem Cost',
    diamondWeight: 'Diamond Weight', diamondPrice: 'Diamond Price', diamondCost: 'Diamond Cost',
    craftingFee: 'Crafting Fee', itemCost: 'Item Cost', goldPrice: 'Gold Price', goldCost: 'Gold Cost',
    saveInvoice: 'Save Invoice', saveBack: 'Save & Back',
    selPre: 'Please select ', selPost: ' field first',
    // calculator toasts / errors
    savedToHistory: 'Saved to history!', invoiceUpdated: 'Invoice updated!',
    couldNotSave: 'Could not save: ', couldNotSaveImage: 'Could not save image: ',
    overWeightWarn: 'Stone weight is more than the item weight — check the weights.',
    // purchase / sale mode
    modeSale: 'Sale', modePurchase: 'Purchase',
    salesPricings: 'Sales Pricings', purchasePricings: 'Purchase Pricings',
    salesReceipt: 'SALES RECEIPT',
    badgeSale: 'SALE', badgePurchase: 'PURCHASE',
    ariaTxnMode: 'Purchase or sale',
    // print invoice page
    printInvoiceTitle: 'PRINT INVOICE', optPrintInvoice: 'Print Invoice',
    dataSource: 'Data Source', srcManual: 'Manual', srcSaved: 'From Saved',
    pickSaved: 'Saved calculation', noSavedForMode: 'No saved calculations for this mode.',
    customerHeading: 'CUSTOMER', custName: 'Customer Name', custAddress: 'Address',
    itemDetailsHeading: 'ITEM DETAILS', previewHeading: 'PREVIEW', actionsHeading: 'ACTIONS',
    totalCost: 'Total Cost', invoiceNoLabel: 'Invoice No.',
    totalHint: 'Filled in from the weights and gold price. Type over it to use a different figure.',
    salesInvoice: 'SALES INVOICE', purchaseInvoice: 'PURCHASE INVOICE',
    exportInvoice: 'Export Invoice', printInvoiceBtn: 'Print Invoice',
    invoiceFooter: 'Thank you',
    // pricing view
    pricingTitle: 'Pricing', pricingGoldLabel: 'Gold Price', pricingGemLabel: 'Gem Price (per Yt)',
    pricingDiamondLabel: 'Diamond Price', pricingBasePurity: 'Price entered at',
    // invoice / receipt (shared by the calculator and the profile page)
    purchaseReceipt: 'PURCHASE RECEIPT', totalItemCost: 'TOTAL ITEM COST', saveJpeg: 'Save Image',
    secWeights: 'WEIGHTS', secPricing: 'PRICING', secFees: 'FEES',
    secItem: 'ITEM', secItemName: 'ITEM NAME', secGold: 'GOLD', secGem: 'GEM', secDiamond: 'DIAMOND',
    itemTypeLabel: 'Type',
    pricePerK: 'Price per K', goldWeight: 'Gold Weight',
    // profile
    notSignedIn: "You're not signed in",
    notSignedInProfile: 'Sign in to view your profile and saved history.',
    totalInvoice: 'Total Invoice', historyHeading: 'HISTORY',
    emptyTitle: 'No saved calculations yet',
    emptyDesc: 'Calculations you save will appear here.',
    couldNotLoad: 'Could not load history',
    editProfile: 'Edit profile',
    editProfileDesc: 'Change the name shown on your profile.',
    displayName: 'Display name', namePlaceholder: 'Your name',
    profilePicture: 'Profile picture', male: 'Male', female: 'Female',
    signOut: 'Sign Out',
    couldNotSaveName: 'Could not save name: ', couldNotSignOut: 'Could not sign out: ',
    // compare (dedicated Compare Mode page)
    notSignedInCompare: 'Sign in to compare your saved invoices.',
    compareMode: 'COMPARE MODE', select: 'Select', selectTitle: 'SELECT',
    pleaseSelectCompare: 'Please select to compare',
    colItemInfo: 'Item Info', colItemWeight: 'Item Weight', colTotalCost: 'Total Cost',
    lblGem: 'Gem', lblDiamond: 'Diamond', lblLoss: 'Loss',
    noInvoices: 'No saved invoices yet',
    noInvoicesDesc: 'Save some calculations first, then compare them here.',
    // history
    signInHistory: 'Sign in to see your history',
    signInHistoryDesc: 'Your saved calculations are tied to your account. Sign in to view, compare, and manage them.',
    savedSuffix: 'saved',
    purity: 'Purity', itemWeightLabel: 'Item Weight',
    deleteConfirm: 'Delete this saved calculation?', couldNotDelete: 'Could not delete: ',
    // sign-in
    welcome: 'Welcome',
    signinIntro: 'Sign in to save your calculation history across devices.',
    continueGoogle: 'Continue with Google', orDivider: 'or',
    emailLabel: 'Email', emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password', passwordPlaceholder: 'At least 6 characters',
    createAccount: 'Create Account',
    noAccount: 'No account? Create one', haveAccount: 'Have an account? Sign in instead',
    phoneLabel: 'Phone number', sendCode: 'Send Verification Code',
    otpLabel: 'Verification code', otpPlaceholder: '6-digit code',
    verifySignIn: 'Verify & Sign In', useDifferent: 'Use a different number',
    skipContinue: 'Skip and continue without signing in',
    enterPhone: 'Please enter your phone number.', enterOtp: 'Enter the verification code.',
    codeSent: 'Verification code sent. Check your SMS.',
    // sign-in errors
    errInvalidEmail: 'That email address looks invalid.',
    errUserNotFound: 'No account found for that email.',
    errWrongPassword: 'Wrong password. Try again.',
    errInvalidCredential: 'Incorrect email or password.',
    errEmailInUse: 'An account already exists for that email.',
    errWeakPassword: 'Password must be at least 6 characters.',
    errPopupClosed: 'Google sign-in popup was closed.',
    errNetwork: 'Network problem. Check your connection.',
    errInvalidPhone: 'Phone number format is invalid. Use +country code (e.g. +959...).',
    errInvalidCode: 'Incorrect verification code.',
    errCodeExpired: 'Code expired. Request a new one.',
    errTooManyRequests: 'Too many attempts. Try again later.',
    errGeneric: 'Something went wrong. Please try again.'
  },
  mm: {
    loading: 'ခဏစောင့်ပါ…',
    signIn: 'ဝင်ရောက်ရန်',
    close: 'ပိတ်မည်', cancel: 'မလုပ်တော့ပါ', save: 'သိမ်းမည်', done: 'ပြီးပြီ', edit: 'ပြင်မည်',
    clear: 'ရှင်းမည်',
    mmk: 'ကျပ်', perK: '/ ကျပ်ဿား', perYt: '/ ရတီ',
    unitK: 'ကျပ်', unitP: 'ပဲ', unitY: 'ရွေး', unitYt: 'ရတီ',
    optEditPrice: 'ရွှေဈေး ပြင်ရန်', optHistory: 'မှတ်တမ်း',
    optEditInfo: 'အချက်အလက် ပြင်ရန်', optCompare: 'နှိုင်းယှဉ်ရန်',
    ariaMenu: 'မီနူး', ariaBack: 'ဂဏန်းတွက်စက်သို့ ပြန်ရန်',
    ariaToggleTheme: 'ပုံစံပြောင်းမည်', ariaPricing: 'ဈေးနှုန်း', ariaCalculator: 'ဂဏန်းပေါင်းစက်',
    ariaProfile: 'ပရိုဖိုင်',
    typeGold: 'ရွှေ', typeGoldGem: 'ရွှေ + ကျောက်', typeGoldDiamond: 'ရွှေ + စိန်',
    itemNamePill: 'ပစ္စည်းအမည်', itemNameLabel: 'ပစ္စည်းအမည်', specificItem: 'အမျိုးအမည်',
    itemRing: 'လက်စွပ်', itemBracelet: 'လက်ကောက်', itemEarrings: 'နားကပ်', itemPendant: 'ဆွဲသီး',
    itemNecklace: 'ဆွဲကြိုး',
    itemHandChain: 'လက်ဆွဲ', itemFootChain: 'ခြေချင်း', itemHairClipper: 'ဆံညှပ်', itemOther: 'အခြား',
    goldPurity: 'ရွှေရည်', quality: 'ရွှေရည်',
    quality16: '၁၆ ပဲရည်', quality15: '၁၅ ပဲရည်', quality145: '၁၄.၅ ပဲရည်', quality14: '၁၄ ပဲရည်', quality12: '၁၂ ပဲရည်',
    currentGoldPrice: 'လက်ရှိ ရွှေဈေး', itemTypePlaceholder: 'အမျိုးအစား',
    itemWeight: 'ပစ္စည်းအလေးချိန်', lossWeight: 'အလျော့ချိန်',
    modeCalculate: 'တွက်ချက်', modeFixed: 'သတ်မှတ်',
    gemWeight: 'ကျောက်ချိန်', gemPrice: 'ကျောက်ဈေး', gemCost: 'ကျောက်ဖိုး',
    diamondWeight: 'စိန်အချိန်', diamondPrice: 'စိန်ဈေး', diamondCost: 'စိန်ဖိုး',
    craftingFee: 'လက်ခ', itemCost: 'ပစ္စည်းဖိုး', goldPrice: 'ရွှေဈေး', goldCost: 'ရွှေဖိုး',
    saveInvoice: 'ဘောက်ချာသိမ်းမည်', saveBack: 'သိမ်း၍ ပြန်မည်',
    selPre: '', selPost: ' ကို ဦးစွာ ရွေးချယ်ပါ',
    savedToHistory: 'မှတ်တမ်းထဲ သိမ်းပြီးပါပြီ။', invoiceUpdated: 'ဘောက်ချာ ပြင်ဆင်ပြီးပါပြီ။',
    couldNotSave: 'သိမ်း၍မရပါ: ', couldNotSaveImage: 'ပုံ သိမ်း၍မရပါ: ',
    overWeightWarn: 'ကျောက်/စိန်ချိန်သည် ပစ္စည်းအလေးချိန်ထက် ပိုနေသည် — အလေးချိန်များ ပြန်စစ်ပါ။',
    modeSale: 'အရောင်း', modePurchase: 'အဝယ်',
    salesPricings: 'အရောင်း ဈေးနှုန်း', purchasePricings: 'အဝယ် ဈေးနှုန်း',
    salesReceipt: 'အရောင်း ဘောက်ချာ',
    badgeSale: 'အရောင်း', badgePurchase: 'အဝယ်',
    ariaTxnMode: 'အဝယ် သို့မဟုတ် အရောင်း',
    printInvoiceTitle: 'ဘောက်ချာ ပရင့်ထုတ်ရန်', optPrintInvoice: 'ဘောက်ချာ ပရင့်ထုတ်ရန်',
    dataSource: 'အချက်အလက် ရယူပုံ', srcManual: 'ကိုယ်တိုင် ဖြည့်ရန်', srcSaved: 'သိမ်းထားသည်မှ',
    pickSaved: 'သိမ်းထားသော တွက်ချက်မှု', noSavedForMode: 'ဤအမျိုးအစားအတွက် သိမ်းထားသည် မရှိပါ။',
    customerHeading: 'ဖောက်သည်', custName: 'ဖောက်သည် အမည်', custAddress: 'လိပ်စာ',
    itemDetailsHeading: 'ပစ္စည်း အချက်အလက်', previewHeading: 'အစမ်းကြည့်ရန်', actionsHeading: 'လုပ်ဆောင်ချက်',
    totalCost: 'စုစုပေါင်းကျသင့်ငွေ', invoiceNoLabel: 'ဘောက်ချာ နံပါတ်',
    totalHint: 'အလေးချိန်နှင့် ရွှေဈေးမှ တွက်ပေးထားသည်။ ပြောင်းလိုပါက ပြန်ရိုက်ထည့်နိုင်သည်။',
    salesInvoice: 'အရောင်း ဘောက်ချာ', purchaseInvoice: 'အဝယ် ဘောက်ချာ',
    exportInvoice: 'ဘောက်ချာ ထုတ်ယူရန်', printInvoiceBtn: 'ပရင့်ထုတ်ရန်',
    invoiceFooter: 'ကျေးဇူးတင်ပါသည်',
    pricingTitle: 'ဈေးနှုန်း', pricingGoldLabel: 'ရွှေဈေး', pricingGemLabel: 'ကျောက်ဖိုး (ရတီဈေး)',
    pricingDiamondLabel: 'စိန်ဈေး', pricingBasePurity: 'ဈေးထည့်သည့် ရွှေရည်',
    purchaseReceipt: 'အဝယ် ဘောက်ချာ', totalItemCost: 'စုစုပေါင်းကျသင့်ငွေ', saveJpeg: 'ပုံသိမ်းမည်',
    secWeights: 'အလေးချိန်', secPricing: 'ဈေးနှုန်း', secFees: 'အခကြေးငွေ',
    secItem: 'ပစ္စည်း', secItemName: 'ပစ္စည်းအမည်', secGold: 'ရွှေ', secGem: 'ကျောက်', secDiamond: 'စိန်',
    itemTypeLabel: 'အမျိုးအစား',
    pricePerK: 'ကျပ်ဈေး', goldWeight: 'ရွှေအလေးချိန်',
    notSignedIn: 'အကောင့်ဝင်ထားခြင်း မရှိပါ',
    notSignedInProfile: 'ပရိုဖိုင်နှင့် မှတ်တမ်းများ ကြည့်ရှုရန် အကောင့်ဝင်ပါ။',
    totalInvoice: 'စုစုပေါင်း ဘောက်ချာ', historyHeading: 'မှတ်တမ်း',
    emptyTitle: 'သိမ်းထားသော တွက်ချက်မှု မရှိသေးပါ',
    emptyDesc: 'သိမ်းဆည်းထားသော တွက်ချက်မှုများ ဤနေရာတွင် ပေါ်လာပါမည်။',
    couldNotLoad: 'မှတ်တမ်း ဖွင့်၍မရပါ',
    editProfile: 'ပရိုဖိုင် ပြင်ဆင်ရန်',
    editProfileDesc: 'ပရိုဖိုင်တွင် ပြသမည့် အမည်ကို ပြောင်းပါ။',
    displayName: 'ပြသမည့် အမည်', namePlaceholder: 'သင့်အမည်',
    profilePicture: 'ပရိုဖိုင်ပုံ', male: 'ကျား', female: 'မ',
    signOut: 'ထွက်မည်',
    couldNotSaveName: 'အမည် သိမ်း၍မရပါ: ', couldNotSignOut: 'ထွက်၍မရပါ: ',
    notSignedInCompare: 'သိမ်းထားသော ဘောက်ချာများ နှိုင်းယှဉ်ရန် အကောင့်ဝင်ပါ။',
    compareMode: 'နှိုင်းယှဉ်ခြင်း', select: 'ရွေးချယ်ရန်', selectTitle: 'ရွေးချယ်ရန်',
    pleaseSelectCompare: 'နှိုင်းယှဉ်ရန် ရွေးချယ်ပါ',
    colItemInfo: 'ပစ္စည်း', colItemWeight: 'အလေးချိန်', colTotalCost: 'စုစုပေါင်းဖိုး',
    lblGem: 'ကျောက်', lblDiamond: 'စိန်', lblLoss: 'အလျော့',
    noInvoices: 'သိမ်းထားသော ဘောက်ချာ မရှိသေးပါ',
    noInvoicesDesc: 'အရင် တွက်ချက်မှုများ သိမ်းပြီးမှ ဤနေရာတွင် နှိုင်းယှဉ်နိုင်ပါသည်။',
    signInHistory: 'မှတ်တမ်း ကြည့်ရှုရန် အကောင့်ဝင်ပါ',
    signInHistoryDesc: 'သိမ်းထားသော တွက်ချက်မှုများသည် သင့်အကောင့်နှင့် ချိတ်ဆက်ထားသည်။ ကြည့်ရှု၊ နှိုင်းယှဉ်၊ စီမံရန် အကောင့်ဝင်ပါ။',
    savedSuffix: 'ခု သိမ်းထားသည်',
    purity: 'ရွှေရည်', itemWeightLabel: 'ပစ္စည်းအလေးချိန်',
    deleteConfirm: 'ဤသိမ်းထားသော တွက်ချက်မှုကို ဖျက်မလား?', couldNotDelete: 'ဖျက်၍မရပါ: ',
    welcome: 'ကြိုဆိုပါတယ်',
    signinIntro: 'သင့်တွက်ချက်မှု မှတ်တမ်းကို စက်အသီးသီးတွင် သိမ်းရန် အကောင့်ဝင်ပါ။',
    continueGoogle: 'Google ဖြင့် ဆက်လက်ရန်', orDivider: 'သို့မဟုတ်',
    emailLabel: 'အီးမေးလ်', emailPlaceholder: 'you@example.com',
    passwordLabel: 'စကားဝှက်', passwordPlaceholder: 'အနည်းဆုံး ၆ လုံး',
    createAccount: 'အကောင့်ဖွင့်မည်',
    noAccount: 'အကောင့်မရှိဘူးလား? ဖွင့်မည်', haveAccount: 'အကောင့်ရှိပြီးသားလား? ဝင်မည်',
    phoneLabel: 'ဖုန်းနံပါတ်', sendCode: 'အတည်ပြုကုဒ် ပို့မည်',
    otpLabel: 'အတည်ပြုကုဒ်', otpPlaceholder: 'ဂဏန်း ၆ လုံး',
    verifySignIn: 'အတည်ပြု၍ ဝင်မည်', useDifferent: 'အခြားနံပါတ် သုံးမည်',
    skipContinue: 'အကောင့်မဝင်ဘဲ ဆက်သွားမည်',
    enterPhone: 'သင့်ဖုန်းနံပါတ် ထည့်ပါ။', enterOtp: 'အတည်ပြုကုဒ် ထည့်ပါ။',
    codeSent: 'အတည်ပြုကုဒ် ပို့လိုက်ပါပြီ။ SMS ကို စစ်ပါ။',
    errInvalidEmail: 'အီးမေးလ်လိပ်စာ မမှန်ပါ။',
    errUserNotFound: 'ထိုအီးမေးလ်ဖြင့် အကောင့် မတွေ့ပါ။',
    errWrongPassword: 'စကားဝှက် မှားနေသည်။ ထပ်စမ်းပါ။',
    errInvalidCredential: 'အီးမေးလ် သို့မဟုတ် စကားဝှက် မမှန်ပါ။',
    errEmailInUse: 'ထိုအီးမေးလ်ဖြင့် အကောင့် ရှိပြီးသားဖြစ်သည်။',
    errWeakPassword: 'စကားဝှက် အနည်းဆုံး ၆ လုံး ရှိရမည်။',
    errPopupClosed: 'Google ဝင်ရောက်မှု ပိတ်လိုက်သည်။',
    errNetwork: 'ကွန်ရက် ပြဿနာ။ အင်တာနက် စစ်ပါ။',
    errInvalidPhone: 'ဖုန်းနံပါတ် ပုံစံ မမှန်ပါ။ +နိုင်ငံကုဒ် သုံးပါ (ဥပမာ +၉၅၉...)။',
    errInvalidCode: 'အတည်ပြုကုဒ် မမှန်ပါ။',
    errCodeExpired: 'ကုဒ် သက်တမ်းကုန်သွားပြီ။ အသစ်တောင်းပါ။',
    errTooManyRequests: 'ကြိုးစားမှု များလွန်းသည်။ နောက်မှ ထပ်စမ်းပါ။',
    errGeneric: 'တစ်ခုခု မှားယွင်းသွားသည်။ ထပ်စမ်းပါ။'
  }
};

export function getLang() {
  try { return localStorage.getItem('goldCalcLang') === 'mm' ? 'mm' : 'en'; }
  catch (e) { return 'en'; }
}
export function setLang(l) {
  try { localStorage.setItem('goldCalcLang', l === 'mm' ? 'mm' : 'en'); } catch (e) {}
}
export function tr(key, l) {
  l = l || getLang();
  return (I18N[l] && I18N[l][key]) || I18N.en[key] || key;
}
export function applyLangClass(l) {
  l = l || getLang();
  document.documentElement.lang = l === 'mm' ? 'my' : 'en';
  document.body.classList.toggle('lang-mm', l === 'mm');
}
// Translate all [data-i18n] (text), [data-i18n-ph] (placeholder), [data-i18n-aria] (aria-label)
export function translateStatic(l) {
  l = l || getLang();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = tr(el.getAttribute('data-i18n'), l);
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const v = tr(el.getAttribute('data-i18n-ph'), l);
    if (v != null) el.setAttribute('placeholder', v);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const v = tr(el.getAttribute('data-i18n-aria'), l);
    if (v != null) el.setAttribute('aria-label', v);
  });
}

// Mappings for saved data → translation keys
export const TYPE_KEY = { 'gold': 'typeGold', 'gold-gem': 'typeGoldGem', 'gold-diamond': 'typeGoldDiamond' };
export const ITEM_KEY = {
  ring: 'itemRing', bracelet: 'itemBracelet', earrings: 'itemEarrings', pendant: 'itemPendant',
  necklace: 'itemNecklace',
  handchain: 'itemHandChain', footchain: 'itemFootChain', hairclipper: 'itemHairClipper', other: 'itemOther'
};
export const PURITY_KEY = { '16K': 'quality16', '15K': 'quality15', '14.5K': 'quality145', '14K': 'quality14', '12K': 'quality12' };
export const QUALITY_KEYS = ['quality16', 'quality15', 'quality145', 'quality14', 'quality12'];
