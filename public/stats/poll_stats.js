class PollMeter {
    constructor() {
        this.contasinerId = 'poll-meter-container';
        this.updateInterval = 3000;
        this.gap = 10;
    }

    init(size) {
        let body = d3.select('body');
        this.container = body.append('div')
            .attr('id', this.contasinerId)
            .style('width', `${(size*2) + this.gap}px`)
            .style('font-family', 'Helvetica')
            .style('font-weight', 'bold')
            .style('position', 'absolute')
            .style('right', '15px')
            .style('bottom', '15px');

        this.container
            .append('svg:svg')
            .attr('width', size)
            .attr('height', size)
            .style('margin-right', `${this.gap}px`)
            .attr('id', 'angular');

        this.container
            .append('svg:svg')
            .attr('width', size)
            .attr('height', size)
            .attr('id', 'react');

        this.summary = this.container.append('div')
            .attr('class', 'summary')
            .style('color', '#7a8b9c')
            .style('text-align', 'right');

        let angularConfig = liquidFillGaugeDefaultSettings();
        angularConfig.circleColor = '#c30e2e';
        angularConfig.textColor = '#c30e2e';
        angularConfig.waveTextColor = '#FFFFFF';
        angularConfig.waveColor = '#dd0330';
        angularConfig.waveAnimateTime = 1000;
        let angularMeter = loadLiquidFillGauge('angular', 0, angularConfig);
        let reactConfig = liquidFillGaugeDefaultSettings();
        reactConfig.circleColor = '#4ab3ce';
        reactConfig.textColor = '#3e839c';
        reactConfig.waveTextColor = '#FFFFFF';
        reactConfig.waveColor = '#53c1de';
        reactConfig.waveAnimateTime = 1000;
        let reactMeter = loadLiquidFillGauge('react', 0, reactConfig);

        d3.selectAll('.liquidFillGaugeText')
            .style('font-family', 'Helvetica')
            .style('font-weight', 'bold');


        this.updateMeters(angularMeter, reactMeter);
    }

    updateMeters(angularMeter, reactMeter) {
        $.get('/stats', (data) => {
            let result = {};
            let totalCount = 0;
            for (let i = 0; i < data.length; i++) {
                let key = data[i]['_id'];
                result[key] = data[i]['count'];
                totalCount += result[key];
            }
            this.setPercent(angularMeter, result.angular, totalCount);
            this.setPercent(reactMeter, result.react, totalCount);
            this.summary.transition()
                .duration(500).text(totalCount);
            setTimeout(() => this.updateMeters(angularMeter, reactMeter),
                this.updateInterval);
        });
    }

    setPercent(meter, votes, total) {
        let perc = votes ? Math.round((votes / total) * 100) : 0;
        meter.update(perc);
    }

    remove() {
        this.container.remove();
    }
}
