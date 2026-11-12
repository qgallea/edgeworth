# Exchange Lab

A bilingual Edgeworth box for teaching a two-person exchange economy. Open `index.html` in a browser. The tool runs offline and uses only the files in this folder.

## Teach with the course example

1. In **Gains from trade**, read Samuel’s bundle from the bottom-left corner and Romane’s from the top-right corner. The diamond **ω** marks the initial endowment. Drag **T**, click the diagram, or focus it and use the arrow keys. Hold Shift to move five units. The table shows how much of each good changes hands and the change in each person’s utility.
2. In **Pareto efficiency**, compare the indifference curves through T. Select **Trace the curve** and move T left or right. Every point on the curve is efficient, including very unequal allocations.
3. In **Market prices**, change the price of X in units of Y. The budget line rotates through ω and the demand markers show each person’s choice. The grey **Endowment lens** stays fixed as prices change. It contains the allocations both consumers like at least as much as their starting bundles. Select **Find clearing price** to see where the two choices agree.
4. Choose **Redistribute 10 X** to transfer 10 units of X from Romane to Samuel before trade. Find the new clearing price. Compare the new allocation with the original equilibrium.

**Economy settings** changes endowments, preferences and total supplies. **Reset** restores the selected scenario. **Learning guide** contains five short experiments. Each **Try in the lab** button loads the course settings for that experiment. **Classroom view** gives the diagram and controls more screen space.

## The numerical example

The economy in Quentin Gallea’s *Économie I* slides contains 80 X and 50 Y. Samuel initially owns (20, 30) and Romane owns (60, 20). The tool uses Cobb–Douglas utilities, U = X<sup>α</sup>Y<sup>1−α</sup>, with weights of 0.5 for Samuel and 0.4 for Romane. These weights were chosen to reproduce the illustrated trade.

At a price of 1 Y per X, the two consumers demand 57 X and 73 Y in total. At 0.5 Y per X, Samuel chooses (40, 20) and Romane chooses (40, 30). Both gain and both markets clear. Utility differences are meaningful only within each person’s chosen representation.

## Publish on GitHub Pages

1. Create a GitHub repository and upload `index.html`, `styles.css`, `mark.svg`, `app.js`, `chart.js`, `model.js` and `guide.js` together at the root of the `main` branch.
2. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, then **main** and **/(root)**. Save.
3. Once the deployment finishes, open **Visit site** in the Pages settings. Subsequent changes to these files on `main` update the site.

The files use relative paths, so a project site works under its repository name. [GitHub Pages publishing settings](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

To open a particular view in class, append a query string to the site address. For example, `?lang=fr&topic=prices&scenario=course` opens the course example in French on the price tab. Supported topics are `trade`, `efficiency` and `prices`. Scenario names are `course`, `tastes`, `efficient`, `unequal` and `transfer`.
