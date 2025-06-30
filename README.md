**Introduction**

This news app is an effort into displaying the inferior choices offered to larger women, described by most brands as plus-size. It sheds light on the differences between clothes (specifically, dresses in this project) offered to thinner women vs larger women in terms of silhouettes, drapes, patterns, necklines, etc. It does so through the example of Barcelona based brand, Mango, which has a sizeable presence in the US fashion market. The differences are shown mostly visually but also differentiates between the offerings based on descriptions offered by the brand. 

## Development Efforts

### Scraping

The hardest part of this work was getting the data in order. Scraping Mango, which uses lazy loading, made the process harder. Getting the page to load and gathering links as it loaded was the first part. I stored all the links in a CSV file.  

Next, each product link was scraped to get product details: Reference ID, link to the dress, description, sizes available along with availability (Mango provides stock levels), color, and all image URLs.  

I initially used Playwright for both lazy loading and scraping product links, which was also giving me the image URLs. However, Mango later changed some of their HTML attributes, and no matter what selector I passed, I could not get the image URLs. It turns out I could simply pass my product links and use Beautiful Soup to extract the image URLs instead.

In the future, I plan to ensure most of my data is ready before coding. Only small design snippets will be developed to check if my vision is translating well before data adjustments.

#### Scraping logic

I specifically scraped for the 493-width image URL. Mango duplicates images in various sizes, from width 100 to 2048. After examining the quality of each, 493 was a good compromise in terms of quality and load speed — important since the site features many images.

While I could approximate where the regular-sized model image appeared in slideshows (usually second), there was no pattern for the plus-size model. As a result, plus-size carousel images were manually added to the JSON file. The plus-size product was usually the second last image, but sometimes this image was a close-up detail. This explains why some “view products” clicks show a close-up instead of the full dress — something I plan to fix in a future polished version.

#### Concurrency

My initial Playwright script was slow, taking about 9–14 minutes per scrape. Implementing concurrency (using workers) sped this up dramatically — each category could be scraped in under a minute. This was an exciting moment: I finally saw theoretical concepts from my operating systems course in action, making it one of the most delightful parts of the process.

---

### Path Trace Animation Process

I loved pudding.cool’s "Pocket" feature and was inspired by its path trace approach. At first, I worried I'd need to manually extract image backgrounds. Thankfully, I didn’t — I downloaded product images (PNG format) using `requests`.  

I converted images to grayscale using `cv2` to focus on outlines rather than RGB channels. Since the photos had nearly white backgrounds, I inverted them, turning dark dress shapes into white on a black background — effectively creating masks. These masks were pure black-and-white images with white dress shapes on a black background, ready for edge detection.

`cv2.Canny` helped extract dress boundaries but produced PNG outlines. To animate paths, I needed vectors.

Using ImageMagick, I converted PNG masks into PBM format (required by Potrace). Potrace then converted PBMs into SVGs. I batch-processed these using CLI tools, then converted SVGs into JSON (via a manifest file).  

I used the `<path>` element to trace SVGs and animate them, staggering animation starts by multiplying each image’s index by a fixed delay. Because all outlines shared the same (0,0) origin, they stacked neatly.

This was my favorite part of the process. However, I did clean up bad masks and outlines manually — `cv2` was too "robust," sometimes outlining prints inside dresses. In the future, I’ll refine my program to be less sensitive.

---

### Carousels

This is where I relied on LLM help the most. I created four carousels. Only after finishing the third did I feel the project coming together.  

The third carousel compares silhouettes offered to larger women with those offered to thinner women. The fourth carousel's images were manually arranged, which was surprisingly fun.

The hardest part (on par with scraping) was getting annotation bars under the carousels to move correctly on hover. The final carousel’s annotations were key to the narrative, though there's still a small bug where the bar starts slightly flushed left, and another where you can’t hover over the last couple of images due to previous images expanding. These are issues to fix.

---

### Chart

I analyzed the Description column of scraped data, resulting in 302 unique words (after removing stopwords). I manually chose words to display, grouped them into semantic buckets using an LLM, and used these as dropdown categories.

One challenge was clarifying pattern-making terms. For example, the word "dart" appears twice in regular-size clothing and never in plus-size. A dart "is a small triangle of fabric pinched out to turn flat cloth into a shape capable of going around curves." Plus-size clothes often use accessories (like belts) instead of shape-building patterns.

Notably, "belt" appeared 39 times in plus-size clothing descriptions but only 9 times in regular. This reflects a reliance on a singular piece of elastic to create shape for plus-size wearers, whereas regular-size clothing offers more varied shaping methods.

---

## Deployment and Maintenance

This site is deployed via GitHub Pages using a Jekyll build.  

The site requires further work before it reaches a "maintenance" stage. Since data collection is a snapshot and not updated periodically via GitHub Actions, it does not need ongoing scraping maintenance.  

All images and outlines are stored as static files. I’m not using obscure libraries, so I expect long-term compatibility.

In the future, I'd like to analyze more brands, similar to The Pudding’s "Pockets" feature, to show this is an industry-wide problem, not limited to Mango.

---

## Data Accessibility

I plan to create a colophon on the site explaining the process and providing CSV files for users to review and verify.

---

## App Longevity

When does this app outlive its usefulness?  
When plus-size women have equal options as thinner women — in number and variety.

I want to continue refining it and at least include one more brand to strengthen the pattern. In my mind, this project continues indefinitely.  

I will fork the repository to my personal account to keep working on it.

---

 
 [Final Project Submission: May 16](https://docs.google.com/document/d/11Mb26CY8Q0KcvRfKhCLjcvt4UAj3O91FKMeIMkmn4ZY/edit?tab=t.ku07nruifu8t) 
