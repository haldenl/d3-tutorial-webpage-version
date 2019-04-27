const width = 600;
const height = 400;
const margin = { top: 40, right: 40, bottom: 50, left: 100 };
state = {year: 1900, sex: 2};

d3.json('./census.json').then(census => {

const container = d3.create('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom);

const chart = container.append('g')
  .attr('id', 'chart')
  .attr('transform', `translate(${margin.left}, ${margin.top})`);

const ageDomain = unique(census.map(row => row.age_group));

const peopleDomain = [0, d3.max(census, row => row.people)];

const sexDomain = [1, 2];

const x = d3.scaleBand().rangeRound([0, width])
  .padding(0.1)
  .domain(ageDomain);

const y = d3.scaleLinear()
  .range([height, 0])
  .domain(peopleDomain);

const maleColor = '#42adf4';
const femaleColor = '#ff96ca';

const color = d3.scaleOrdinal()
  .range([maleColor, femaleColor])
  .domain(sexDomain);

const xaxis = chart
  .append('g')
  .attr('class', 'axis axis--x')
  .attr('transform', `translate(0, ${height})`)
  .call(d3.axisBottom(x));

const yaxis = chart
  .append('g')
  .attr('class', 'axis axis--y')
  .call(d3.axisLeft(y));

container.append("text")
  .attr("transform", `translate(${(width + margin.left + margin.right)/2},20)`)
  .style("text-anchor", "middle")
  .style("font-weight", 700)
  .text("Census Age Group and Population by Sex");

const ytitle = chart.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 0 - margin.left)
  .attr("x", 0 - (height / 2))
  .attr("dy", "1em")
  .style("text-anchor", "middle")
  .text("Population");

const xtitle = chart.append("text")             
  .attr("transform", `translate(${(width/2)}, ${(height + margin.top)})`)
  .style("text-anchor", "middle")
  .text("Age Group");

const legend = chart
  .selectAll(".legend")               // step 1
  .data(color.domain())               // step 2
  .enter()                            // step 3
  .append("g")                        // step 4
  .attr("class", "legend")            // step 5
  .attr("transform", function(d, i) { // step 5
    // i is the index
    return `translate(0, ${i * 20})`; 
  })
  .style('font-family', 'sans-serif');

legend.append("rect")
  .attr('class', 'legend-rect')
  .attr("x", width + margin.right-12)
  .attr("y", 65)
  .attr("width", 12)
  .attr("height", 12)
  .style("fill", color);

legend.append("text")
  .attr('class', 'legend-text')
  .attr("x", width + margin.right-22)
  .attr("y", 70)
  .style('font-size', "12px")
  .attr("dy", ".35em")
  .style("text-anchor", "end")
  .text(function(d) { return d === 1 ? 'Male' : 'Female'; });

const filteredData = census.filter(row => isYearAndSex(row, state.year, state.sex));

bars = chart.selectAll('.bar').data(filteredData);

const enterbars = bars
  .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', (d) => x(d.age_group))
    .attr('y', (d) => y(d.people))
    .attr('width', x.bandwidth())
    .attr('height', (d) => height - y(d.people))
    .attr('fill', (d) => color(d.sex));

const tip = d3.tip()
  .attr('class', "d3-tip")
  .style("color", "white")
  .style("background-color", "black")
  .style("padding", "6px")
  .style("border-radius", "4px")
  .style("font-size", "12px")
  .offset([-10, 0])
  .html(function(d) { return `<strong>${d3.format(',')(d.people)}</strong> people`; });

container.call(tip);

chart
  .selectAll('.bar')
  .on('mouseover', function(d) {
    // show the tooltip on mouse over
    tip.show(d, this);
    // when the bar is mouse-overed, we slightly decrease opacity of the bar.
    d3.select(this).style('opacity', 0.7);
  }) 
  .on('mouseout', function(d) { 
    // hide the tooltip on mouse out
    tip.hide();
    d3.select(this).style('opacity', 1)
  });

legend
  .selectAll('.legend-rect')
  .style('opacity', d => d === state.sex ? 1 : 0.5);

legend
  .selectAll('.legend-text')
  .style('opacity', d => d === state.sex ? 1 : 0.5)
  .style('font-weight', d => d === state.sex ? 700 : 400);

legend
  .on('click', d => update(d, 0))

legend
  .style('cursor', 'pointer');

container.selectAll('text').style("font-family", "sans-serif");


function update(sex, step) {

  // Step 1. Data.
  state.sex = sex;
  state.year += step;
  const newData = census.filter(row => isYearAndSex(row, state.year, state.sex));
  
  // Step 2. Join.
  const bars = chart.selectAll('.bar')
      .data(newData, (d) => {
        if (d.year === state.year) {
          // the age for the current year should match the age - step for the previous year.
          return d.age_group - step;
      } else {
          return d.age_group;
      }
    });
  
  // Step 3. Enter.
  bars.enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.age_group))
    .attr('y', d => y(0))
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('fill', d => color(d.sex))
    .on('mouseenter', function(d) {
      // show the tooltip on mouse enter
      tip.show(d, this);
      d3.select(this).style('opacity', 0.7);
    })
      .on('mouseout', function(d) { 
      // hide the tooltip on mouse out
      tip.hide();
      d3.select(this).style('opacity', 1)
    })
  .transition('enter-transition')
  .duration(500)
    .attr('y', d => y(d.people))
    .attr('height', d => height - y(d.people))
  
  // Step 4. Update.
  bars
    .transition('update-transition')
    .duration(500)
      .attr('x', d => x(d.age_group))
      .attr('y', d => y(d.people))
      .attr('height', d => height - y(d.people))
      .attr('fill', d => color(d.sex));
  
  // Step 5. Exit.
  bars.exit()
    .transition('exit-transition')
      .duration(500)
      .attr('height', 0)
      .attr('y', y(0))
      .remove();
  
  // update legend
  legend.selectAll('.legend-rect')
    .style('opacity', d => d === state.sex ? 1 : 0.5);
  
  legend.selectAll('.legend-text')
    .style('opacity', d => d === state.sex ? 1 : 0.5)
    .style('font-weight', d => d === state.sex ? 700 : 400);
  
  // update the year text
  document.getElementById('curr-year').textContent = state.year;
}

document.getElementById('curr-year').textContent = state.year;
document.getElementById('decrement').addEventListener('click', () => update(state.sex, -10));
document.getElementById('increment').addEventListener('click', () => update(state.sex, 10));
document.getElementById('switch-sex').addEventListener('click', () => update(state.sex === 1 ? 2 : 1, 0));


d3.select('#viz')
  .node().appendChild(container.node());

});

function isYearAndSex(row, year, sex) {
  return row.year === year && row.sex === sex;
}

function unique(arr) {
  return arr.filter(d => arr.indexOf((v, i) => arr.indexOf(v) === i));
}