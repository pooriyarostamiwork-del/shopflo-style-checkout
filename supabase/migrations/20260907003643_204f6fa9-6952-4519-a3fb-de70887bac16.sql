UPDATE public.pet_products
SET breed_size = 'بزرگ'
WHERE species ILIKE '%سگ%'
  AND breed_size IS DISTINCT FROM 'بزرگ'
  AND public.normalize_persian(coalesce(name,'') || ' ' || coalesce(description,'')) ~*
      '(نژاد بزرگ|نژادهای بزرگ|large breed|maxi|گلدن رتریور|golden retriever|ژرمن شپرد|german shepherd|روتوایلر|rottweiler|لابرادور|labrador|هاسکی|husky|دوبرمن|doberman|سنت برنارد|great dane|داگ دو بوردو)';

UPDATE public.pet_products
SET breed_size = 'کوچک'
WHERE species ILIKE '%سگ%'
  AND breed_size IS DISTINCT FROM 'کوچک'
  AND public.normalize_persian(coalesce(name,'') || ' ' || coalesce(description,'')) ~*
      '(نژاد کوچک|نژادهای کوچک|small breed|mini breed|شیتزو|shih tzu|پامرانیان|pomeranian|چیهواهوا|chihuahua|تریر|terrier|پودل|poodle)'
  AND public.normalize_persian(coalesce(name,'') || ' ' || coalesce(description,'')) !~*
      '(نژاد بزرگ|large breed|maxi)';

UPDATE public.pet_products SET breed_size = NULL
WHERE breed_size IS NOT NULL AND (species IS NULL OR species NOT ILIKE '%سگ%');