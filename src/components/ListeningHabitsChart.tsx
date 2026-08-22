import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ListeningData {
  date: string;
  minutes: number;
}

const mockData: ListeningData[] = [
  { date: 'Mon', minutes: 15 },
  { date: 'Tue', minutes: 45 },
  { date: 'Wed', minutes: 30 },
  { date: 'Thu', minutes: 60 },
  { date: 'Fri', minutes: 20 },
  { date: 'Sat', minutes: 90 },
  { date: 'Sun', minutes: 120 },
];

export const ListeningHabitsChart: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!wrapperRef.current || !chartRef.current) return;

    const renderChart = () => {
      if (!wrapperRef.current || !chartRef.current) return;
      const clientWidth = wrapperRef.current.clientWidth;
      if (clientWidth <= 0) return;

      // Clear any existing chart
      d3.select(chartRef.current).selectAll('*').remove();

      const margin = { top: 20, right: 20, bottom: 30, left: 40 };
      const width = Math.max(0, clientWidth - margin.left - margin.right);
      const height = Math.max(0, 200 - margin.top - margin.bottom);

      const svg = d3
        .select(chartRef.current)
        .attr('width', '100%')
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3
        .scaleBand()
        .range([0, width])
        .padding(0.3)
        .domain(mockData.map((d) => d.date));

      const y = d3
        .scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(mockData, (d) => d.minutes) || 100]);

      // Add X axis
      svg
        .append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0))
        .call((g) => g.select('.domain').remove())
        .selectAll('text')
        .attr('fill', '#888888')
        .attr('font-size', '10px')
        .attr('dy', '1em');

      // Add Y axis
      svg
        .append('g')
        .call(d3.axisLeft(y).ticks(4).tickSize(0))
        .call((g) => g.select('.domain').remove())
        .selectAll('text')
        .attr('fill', '#888888')
        .attr('font-size', '10px')
        .attr('dx', '-0.5em');

      // Add horizontal grid lines
      svg
        .append('g')
        .attr('class', 'grid')
        .call(
          d3
            .axisLeft(y)
            .ticks(4)
            .tickSize(-width)
            .tickFormat(() => '')
        )
        .call((g) => g.select('.domain').remove())
        .selectAll('.tick line')
        .attr('stroke', 'rgba(255, 255, 255, 0.05)')
        .attr('stroke-dasharray', '2,2');

      // Add bars
      svg
        .selectAll('rect')
        .data(mockData)
        .enter()
        .append('rect')
        .attr('x', (d) => x(d.date) || 0)
        .attr('y', (d) => y(d.minutes))
        .attr('width', Math.max(0, x.bandwidth()))
        .attr('height', (d) => Math.max(0, height - y(d.minutes)))
        .attr('fill', '#C5A059')
        .attr('rx', 4)
        .attr('class', 'transition-all duration-300 hover:opacity-80')
        // Simple tooltip on hover
        .append('title')
        .text((d) => `${d.minutes} mins`);
    };

    renderChart();

    const resizeObserver = new ResizeObserver(() => {
      renderChart();
    });

    resizeObserver.observe(wrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="w-full bg-[#111111] border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-serif-display italic font-semibold text-white">Listening Habits</h3>
          <p className="text-xs text-white/50">Daily minutes over the past week</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[#C5A059]">6h 20m</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Total Time</p>
        </div>
      </div>
      <div className="w-full h-[200px]" ref={wrapperRef}>
        <svg ref={chartRef} className="w-full h-full overflow-visible" />
      </div>
    </div>
  );
};
