document.addEventListener("DOMContentLoaded", function() {

    const container = document.getElementById("sizeInventoryChart");

    // Add Chart Type Toggle Button
    const chartToggleBtn = document.createElement("button");
    chartToggleBtn.textContent = "Switch to Bar Chart";
    chartToggleBtn.style.margin = "10px";
    container.prepend(chartToggleBtn);

    // Add Size Group Toggle Button
    const sizeToggleBtn = document.createElement("button");
    sizeToggleBtn.textContent = "Switch to Alpha Sizes";
    sizeToggleBtn.style.margin = "10px";
    container.prepend(sizeToggleBtn);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "#fff")
        .style("padding", "6px 10px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-family", "sans-serif")
        .style("font-size", "14px");

    let currentMode = 'line';
    let currentSizeGroup = 'numeric';
    const categories = ["Available", "Last Few Items", "Not Available"];
    let visibility = { "Available": true, "Last Few Items": true, "Not Available": true };

    chartToggleBtn.addEventListener("click", function() {
        currentMode = (currentMode === 'line') ? 'bar' : 'line';
        chartToggleBtn.textContent = (currentMode === 'line') ? 'Switch to Bar Chart' : 'Switch to Line Chart';
        drawChart();
    });

    sizeToggleBtn.addEventListener("click", function() {
        currentSizeGroup = (currentSizeGroup === 'numeric') ? 'alpha' : 'numeric';
        sizeToggleBtn.textContent = (currentSizeGroup === 'numeric') ? 'Switch to Alpha Sizes' : 'Switch to Numeric Sizes';
        drawChart();
    });

    window.addEventListener("resize", drawChart);
    let numericData = [], alphaData = [], numericSizes = [], alphaSizes = [];

    d3.csv("plus_product_data_mango.csv").then(function(data) {
        let numericInventory = {}, alphaInventory = {};

        data.forEach(function(d) {
            if (!d["Sizes"] || !d["Inventory"]) return;

            let sizes = d["Sizes"].split(",").map(s => s.trim());
            let inventories = d["Inventory"].split(",").map(s => s.trim());

            let firstSize = sizes[0];
            let isNumeric = /^\d+$/.test(firstSize);
            let target = isNumeric ? numericInventory : alphaInventory;

            for (let i = 0; i < sizes.length; i++) {
                let size = sizes[i];
                let inventory = inventories[i];

                if (!target[size]) {
                    target[size] = { "Available": 0, "Last Few Items": 0, "Not Available": 0 };
                }

                if (inventory in target[size]) {
                    target[size][inventory]++;
                }
            }
        });

        numericSizes = Object.keys(numericInventory).sort((a,b)=>parseInt(a)-parseInt(b));
        const alphaOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "1XL", "2XL", "3XL", "4XL"];
        alphaSizes = alphaOrder.filter(size => alphaInventory[size]);

        numericData = numericSizes.map(size => normalize(size, numericInventory));
        alphaData = alphaSizes.map(size => normalize(size, alphaInventory));

        drawChart();
    });

    function normalize(size, source) {
        const total = source[size]["Available"] + source[size]["Last Few Items"] + source[size]["Not Available"];
        return {
            size: size,
            "Available": (source[size]["Available"] / total) * 100,
            "Last Few Items": (source[size]["Last Few Items"] / total) * 100,
            "Not Available": (source[size]["Not Available"] / total) * 100
        };
    }

    function drawChart() {
        d3.select("#sizeInventoryChart").selectAll("svg").remove();

        const data = (currentSizeGroup === 'numeric') ? numericData : alphaData;
        const sizes = (currentSizeGroup === 'numeric') ? numericSizes : alphaSizes;
        const title = (currentSizeGroup === 'numeric') ? "Numeric Sizes" : "Alpha Sizes";

        if (currentMode === 'line') {
            drawLine(data, sizes, title);
        } else {
            drawBar(data, sizes, title);
        }
    }

    function drawLine(data, sizes, title) {
        const margin = { top: 60, right: 200, bottom: 100, left: 130 },
            containerWidth = document.getElementById('sizeInventoryChart').clientWidth,
            width = containerWidth - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        const svg = d3.select("#sizeInventoryChart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scalePoint().domain(sizes).range([0, width]);
        const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

        const color = d3.scaleOrdinal()
            .domain(categories)
            .range(["#4CAF50", "#FFA726", "#EF5350"]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text").attr("transform", "rotate(-40)").style("text-anchor", "end");

        svg.append("g").call(d3.axisLeft(y).tickFormat(d => d + "%"));

        svg.append("text")
            .attr("x", width/2).attr("y", -30)
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .text(`Availability Trends: ${title}`);

        svg.append("text")
            .attr("x", width/2).attr("y", height + 60)
            .attr("text-anchor", "middle")
            .style("font-size", "16px").text("Size");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height/2)
            .attr("y", -45)
            .attr("text-anchor", "middle")
            .style("font-size", "16px").text("% of Items");

        categories.forEach(category => {
            if (!visibility[category]) return;
            const catData = data.map(d => ({ size: d.size, value: d[category] }));
            const line = d3.line().x(d => x(d.size)).y(d => y(d.value));

            svg.append("path")
                .datum(catData)
                .attr("fill", "none")
                .attr("stroke", color(category))
                .attr("stroke-width", 3)
                .attr("d", line);

            svg.selectAll(`.dot-${category}`)
                .data(catData)
                .enter().append("circle")
                .attr("cx", d => x(d.size))
                .attr("cy", d => y(d.value))
                .attr("r", 4)
                .attr("fill", color(category))
                .on("mousemove", function(event, d) {
                    tooltip.html(`<strong>${category}:</strong> ${d.value.toFixed(1)}%`)
                        .style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 28) + "px")
                        .style("opacity", 1);
                })
                .on("mouseout", () => tooltip.style("opacity", 0));
        });

        drawLegend(svg, width);
    }

    function drawBar(data, sizes, title) {
        const margin = { top: 60, right: 200, bottom: 100, left: 60 },
            containerWidth = document.getElementById('sizeInventoryChart').clientWidth,
            width = containerWidth - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        const svg = d3.select("#sizeInventoryChart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().domain(sizes).range([0, width]).padding(0.3);
        const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

        const color = d3.scaleOrdinal()
            .domain(categories)
            .range(["#4CAF50", "#FFA726", "#EF5350"]);

        const stack = d3.stack().keys(categories.filter(c => visibility[c]));
        const series = stack(data);

        svg.selectAll(".layer")
            .data(series)
            .enter().append("g")
            .attr("fill", d => color(d.key))
            .selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("x", d => x(d.data.size))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            .on("mousemove", function(event, d) {
                const group = d3.select(this.parentNode).datum().key;
                const percent = (d[1] - d[0]).toFixed(1);
                tooltip.html(`<strong>${group}:</strong> ${percent}%`)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .style("opacity", 1);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text").attr("transform", "rotate(-40)").style("text-anchor", "end");

        svg.append("g").call(d3.axisLeft(y).tickFormat(d => d + "%"));

        svg.append("text")
            .attr("x", width/2).attr("y", -30)
            .attr("text-anchor", "middle")
            .style("font-size", "22px")
            .text(`Inventory Composition: ${title}`);

        svg.append("text")
            .attr("x", width/2).attr("y", height + 60)
            .attr("text-anchor", "middle")
            .style("font-size", "16px").text("Size");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height/2)
            .attr("y", -45)
            .attr("text-anchor", "middle")
            .style("font-size", "16px").text("% of Items");

        drawLegend(svg, width);
    }

    function drawLegend(svg, width) {
        const color = { "Available": "#4CAF50", "Last Few Items": "#FFA726", "Not Available": "#EF5350" };
        const legend = svg.append("g").attr("transform", `translate(${width + 20}, 10)`);

        categories.forEach((key, i) => {
            const row = legend.append("g").attr("transform", `translate(0, ${i * 30})`)
                .style("cursor", "pointer")
                .on("click", function() {
                    visibility[key] = !visibility[key];
                    drawChart();
                });

            row.append("rect")
                .attr("width", 18).attr("height", 18)
                .attr("fill", color[key])
                .attr("opacity", visibility[key] ? 1 : 0.3);

            row.append("text")
                .attr("x", 25).attr("y", 14).text(key).style("font-size","14px");
        });
    }
});
