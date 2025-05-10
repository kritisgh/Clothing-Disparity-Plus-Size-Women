# final-project
A template for final projects

Can you really dress to your “body type”?
**Data sources**
The data sources will be brands that explicitly have a plus size section. Currently, I have the dresses for Mango scraped already along with their descriptions. The code for that is in the First Git Scraper.
I am also looking into JCPenney and Kohl’s which has an explicit Plus size section. 

Fig 1: Size range of plus size dresses in JCPenney


Total dresses: 278
Short length: 35 (12%) dresses are “short” (find out average length anyway)



Fig 2: Size range of regular dresses in JCPenney 
Total dresses: 1517
Short dresses: 23%










**Descriptions**
Kohls and JCPenney both have descriptions such as these: 

Fig 3: Kohl’s description	Fig 4: JC Penney descriptions



Fig 5: Mango descriptions

**Potential pitfalls and caveats I might encounter.**
I am really struggling with size standardization and this may be something I drop for purposes of this news app. I am simply going to group together what the brands say is plus size. 
Mango gives me pictures of just the products which is good for my outline/contour idea. 

Fig: Picture of Mango’s product 
JCPenney and Kohl’s do not. So the model’s pose and hand placement is going to get in the way of that. 

Fig: Picture of model wearing product for JCPenney. No images of just product.

ELMS Questions
How are you defining a unique record?
Each dress has either an SKU or a REF ID. 

What is the schedule of data updates?/ How will those updates be done - incrementally or wholesale?
No schedule of updates. The sites will be scraped once in wholesale and analysis will be done accordingly. 
Are there parts of the data that you would not display or make searchable? Why?
I might not focus on price at the moment for plus size clothing. It is an issue where brands ask for more money for plus size clothing saying they “used more fabric” This is simply not how manufacturing works in fashion. There’s a Zoe Hong rant on this, who is a fashion designer, illustrator, and instructor at one of the world’s most prestigious fashion universities. (bio) Her YouTube channel is filled with how-to videos on all aspects of the fashion design business, from fashion illustration to garment construction, design process, and fashion business best practices.
“Do not charge extra for the plus size than you do for the straight size of the same style. I don’t even want to start, ’cause it’s always, “Oh, but the fabric usage is…” Shut up! Shut up! You don’t know Jack about fabric usage and cost, but I’m going to explain why that’s not a real thing. Okay, number one: when you’re costing out your garments, you need to cost out the average fabric usage. When you have a straight-size line—let’s say sizes 0 to 14—have you ever seen a brand charge more for the 14 than the 0? No. You know why? Because you’re supposed to average your fabric yield. You use the middle size as your sample size; you’ve probably heard me say this a million times: use the middle size for your sample, get the yield, do the grading, and that yield is the average between the 0 and the 14. You don’t cost out for a 0 and then take a loss on the 14 or vice versa—that’s stupid. Nobody does that; you use the average. Number two: let’s cost out a garment together, okay? Because let me tell you: the cost of the fabric being used is a very small percentage of the cost of the entire garment. So let’s say you see a dress at Nordstrom for $200—and I’m not going to do exact math, so don’t come at me with $2.75 or 55 cents or whatever; I’m just trying to keep it simple for everyone, especially all of you who leave me comments saying you don’t want to learn math to be a fashion designer. This is for you. Let’s say you see a dress at Nordstrom for $200. Well, they bought it wholesale from a designer for $100 a pop; they mark it up so they can pay their employees, their marketing budgets, and whatnot. Right? The designer sold this dress for $100—they also have to make a profit, pay rent, cover overhead, marketing, care labels, shipping, taxes—all that stuff. So let’s say that’s half the cost: $50. Right? So we have $50 that go into the actual garment. Of that $50, more than half is likely going into cutting, pattern making, sewing, finishing—all of that stuff. And so what you have here—I’m going to say about $15 will be spent on just raw materials: $15 of raw materials that went into a $200 dress you saw at Nordstrom, because a lot of that money really goes into paying all the people doing all the labor to make that dress for $200. So, fabric being such a tiny percentage, don’t come at me and be like, “Oh, fabric usage! Zoe, fabric usage!” No.” 
Zoe Hong, Plus Size Fashion 2: Rants, Design, & Construction, Nov 26, 2023
Anyway, I will not get into pricing. I might provide an average of prices if I see this reflected in the brand. But mostly I will focus on the garment’s construction and descriptive features. 


**Projects similar to mine:**
Fashion Continues to Not Care About Size Inclusivity 
This mostly goes into plus size not being a thing at all on runways. I will focus on what is there already and how it is all the same slop. 
Front Row to Fashion Week - NYT
I really love this feature and the clustering works for colors. I worry people won’t see the pattern in silhouettes if I show it this way. I see the pattern because I want to see it (and it is there) but I also don’t want to think my audience is dumb. I will test if this works by trying to implement it. 
