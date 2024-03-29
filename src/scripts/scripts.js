$(function () {

  var dataset = null;
  var currentDataset = null;

  function trackEvent(category, action, label, value) {
    if (!!window['gtag']) {
      gtag('event', action, {
        'event_category': category,
        'event_label': label,
        'value': value
      });
    } else {
      console.log('Event %s', JSON.stringify(arguments));
    }
  }

  function drawBoxChart(element, configuration) {
    var ref = element.find('.ref .value');

    if (configuration.domain.max > 1000000) {
      ref.text((configuration.domain.max / 1000000) + "M");
    } else {
      ref.text((configuration.domain.max / 1000) + "K");
    }

    var chart = element.find('.chart');

    var shortDateFormat = 'MMM YY',
      dateFormat = 'DD MMM YYYY',
      fromDate = moment(configuration.range.from),
      untilDate = moment(configuration.range.until);

    element.find('.short-dates .from').text(fromDate.format(shortDateFormat));
    element.find('.short-dates .until').text(untilDate.format(shortDateFormat));

    element.find('.dates .from').text(fromDate.format(dateFormat));
    element.find('.dates .until').text(untilDate.format(dateFormat));

    // TODO: refactor to update any existing graph
    chart.empty();

    var width = parseInt(chart.width());
    var height = parseInt(chart.height());

    var xScale = d3.scaleBand()
      .domain(configuration.data.map(function(d) { return d.date; }))
      .range([0, width])
      .paddingInner(0.5)
      .paddingOuter(0.0);

    var yScale = d3.scaleLinear()
      .domain([configuration.domain.min, configuration.domain.max])
      .rangeRound([height, 0]);

    var svg = d3.select(chart[0])
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("width", width)
      .attr("height", height);

    svg.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .selectAll(".bar")
      .data(configuration.data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return xScale(d.date); })
      .attr("y", function(d) { return yScale(d.value); })
      .attr("width", xScale.bandwidth())
      .attr("height", function(d) { return height - yScale(d.value); });
  }

  function drawTrendChart(element, configuration) {
    var title = element.find('h2');
    var chart = element.find('.chart');

    if (currentDataset.type === 'country') {
      title.text(sprintf(globalConfiguration.labels.trendTitle, globalConfiguration.labels.trendCountryTitlePart));
    }

    if (currentDataset.type === 'state') {
      title.text(sprintf(globalConfiguration.labels.trendTitle, _.isString(currentDataset.name) ? currentDataset.name : currentDataset.name[globalConfiguration.language]));
    }

    var allValues = [].concat(
      configuration.data.map(function(entry) {
        return entry.positives;
      }),
      configuration.data.map(function(entry) {
        return entry.recovered;
      }),
      configuration.data.map(function(entry) {
        return entry.deceased;
      })
    );

    var max = d3.max(allValues);
    max += Math.round(max * 0.20);

    // TODO: refactor to update any existing graph
    chart.empty();

    var width = parseInt(chart.width());
    var height = parseInt(chart.height()) - 24;

    var xScale = d3.scaleTime()
      .domain(d3.extent(configuration.data, function(d) { return d.date; }))
      .range([0, width]);

    var yScale = d3.scaleLinear()
      .domain([0, max])
      .range([height, 0]);

    var line = d3.line()
      .x(function (d) {
        return xScale(d.date);
      })
      .y(function (d) {
        return yScale(d.value);
      })
      .curve(d3.curveMonotoneX);

    var xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickSize(-height)
      .tickFormat(d3.timeFormat('%d.%m'));

    var yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickSize(-width)
      .tickFormat(d3.format("~s"))

    var svg = d3.select(chart[0])
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("width", width)
      .attr("height", height + 24)
      .append("g");

    svg.append("g")
      .attr("class", "grid grid--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
      .attr("dy", "1.5em");

    svg.append("g")
      .attr("class", "grid grid--y")
      .call(yAxis)
      .selectAll("text")
      .attr("dx", "0.5em")
      .attr("dy", "-0.75em");

    svg.append("path")
      .datum(configuration.data.map(function(d) {
        return { date: d.date, value: d.positives };
      }))
      .attr("fill", "none")
      .attr("stroke", '#FFD99C')
      .attr("stroke-width", 1)
      .attr("d", line);

    svg.append("path")
      .datum(configuration.data.map(function(d) {
        return { date: d.date, value: d.recovered };
      }))
      .attr("fill", "none")
      .attr("stroke", '#B0FF9C')
      .attr("stroke-width", 1)
      .attr("d", line);

    svg.append("path")
      .datum(configuration.data.map(function(d) {
        return { date: d.date, value: d.deceased };
      }))
      .attr("fill", "none")
      .attr("stroke", '#FB4375')
      .attr("stroke-width", 1)
      .attr("d", line);
  }

  function drawDrilldownChart(element, configuration) {
    var values = _.reverse(_.sortBy(configuration.data, ['total']));

    var title = element.find('h2');

    if (currentDataset.type === 'country') {
      title.text(sprintf(configuration.title, globalConfiguration.labels.drilldownCountryTitlePart));
    }

    if (currentDataset.type === 'state') {
      title.text(sprintf(configuration.title, _.isString(currentDataset.name) ? currentDataset.name : currentDataset.name[globalConfiguration.language]));
    }

    var tuples = element.find('.contains-tuples');

    tuples.empty();

    var max = {
      total: d3.max(values, function(d) { return d.total; }),
      delta: d3.max(values, function(d) { return d.delta; })
    };

    var sortedValues = _.reverse(_.sortBy(values, configuration.sortBy));

    $.each(sortedValues, function (i, item) {
      var tuple = $('<li class="tuple">' +
        '<div class="name"></div>' +
        '<div class="delta">' +
          '<div class="value"></div>' +
          '<div class="contains-chart">' +
            '<div class="chart"></div>' +
          '</div>' +
        '</div>' +
        '<div class="total">' +
          '<div class="value"></div>' +
          '<div class="contains-chart">' +
            '<div class="chart"></div>' +
          '</div>' +
        '</div>' +
      '</li>');

      var name = tuple.find('.name');
      name.text(item.name);

      var total = tuple.find('.total .value');

      if (!!item.total || item.total === 0) {
        total.text(item.total);

        var chart = tuple.find('.total .contains-chart .chart');

        var svg = $('<svg width="100%" height="12px" viewBox="0 0 100 12" preserveAspectRatio="none"/>');
        svg.appendTo(chart);
        svg = d3.select(svg[0]);

        if (item.total > 0) {
          svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', Math.round((item.total / max.total) * 100))
            .attr('height', 12)
            .attr('class', 'total-ratio');
        }
      } else {
        total.html('&mdash;');
      }

      var delta = tuple.find('.delta .value');

      if (!!item.delta || item.delta === 0) {
        delta.text((item.delta !== 0 ? (item.delta < 0 ? '-' : '+') : '') + item.delta);

        var chart = tuple.find('.delta .contains-chart .chart');

        var svg = $('<svg width="100%" height="12px" viewBox="0 0 100 12" preserveAspectRatio="none"/>');
        svg.appendTo(chart);
        svg = d3.select(svg[0]);

        if (item.delta > 0) {
          svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', Math.round((item.delta / max.delta) * 100))
            .attr('height', 12)
            .attr('class', 'delta-ratio');
        }
      } else {
        delta.html('&mdash;');
      }

      tuples.append(tuple);
    });
  }

  function setup(data) {
    $('header .context ul').empty();

    var root = $('<li><a href="#"></a></li>');

    root.find('a')
      .data('data', data)
      .text(_.isString(data.name) ? data.name : data.name[globalConfiguration.language]);

    $('header .context ul').append(root);

    $('header .last-update span').text(moment(data.updates.latest).format('LT - L'));

    $('#navigation').empty();

    if (!!data.tags) {
      $.each(data.tags, function(i, tag) {
        var nav = $('<nav>' +
          '<h2>Esplora <span>zona</span></h2>' +
          '<ul></ul>' +
        '</nav>');

        var title = nav.find('h2 span');
        title.text(_.isString(tag.name) ? tag.name : tag.name[globalConfiguration.language]);

        var ul = nav.find('ul');

        $.each(tag.states, function(i, stateName) {
          var li = $('<li><a></a></li>');

          var a = li.find('a');
          a.attr('data-state', stateName);
          a.text(stateName);

          ul.append(li);
        });

        $('#navigation').append(nav);
      });
    }
  }

  function renderBoxCharts(data) {
    var previousEntry = null;

    var increments = data.timeline.map(function(entry) {
      var tuple = [ entry[0], 0, 0, 0 ];

      if (!!previousEntry) {
        tuple[1] = (entry[1] - previousEntry[1]);
        tuple[2] = (entry[2] - previousEntry[2]);
        tuple[3] = (entry[3] - previousEntry[3]);
      }

      previousEntry = entry;

      return tuple;
    });

    var chartWidth = d3.sum([
      $('#box-positives .contains-chart').width(),
      $('#box-recovered .contains-chart').width(),
      $('#box-deceased .contains-chart').width(),
    ]) / 3;

    var daysPerDataPoint = Math.ceil(increments.length / chartWidth) * 2;

    var range = {
      from: d3.min(data.timeline, function (d) { return d[0]; }),
      until: d3.max(data.timeline, function (d) { return d[0]; })
    };

    var values = {}, buffer = [];

    _.each(increments, function(d, i) {
      buffer.push(d);

      if (buffer.length === daysPerDataPoint) {
        var key = _.keys(values).length;

        values[key] = {
          key: key,
          entry: [
            moment(buffer[0][0]),
            d3.sum(buffer, function (d) { return d[1]; }),
            d3.sum(buffer, function (d) { return d[2]; }),
            d3.sum(buffer, function (d) { return d[3]; })
          ],
          count: buffer.length
        };

        buffer = [];
      }
    });

    if (buffer.length > 0) {
      var key = _.keys(values).length;

      values[key] = {
        key: key,
        entry: [
          moment(buffer[0][0]),
          d3.sum(buffer, function (d) { return d[1]; }),
          d3.sum(buffer, function (d) { return d[2]; }),
          d3.sum(buffer, function (d) { return d[3]; })
        ],
        count: buffer.length
      };
    }

    _.each(values, function (d) {
      for (var j = 1; j < 4; j++) {
        d.entry[j] = Math.round(d.entry[j] / (d.count / daysPerDataPoint));
      }
    });

    values = _.map(_.sortBy(_.values(values), 'key'), function (d) {
      return d.entry;
    });

    var computeDomain = function (values) {
      let max = d3.max(values);

      if (max < 1000000) {
        max = Math.ceil(max / 1000) * 1000;
      } else {
        max = Math.ceil(max / 100000) * 100000;
      }

      return {
        min: 0,
        max: max
      };
    };

    drawBoxChart($('#box-positives .contains-chart'), {
      domain: computeDomain(values.map(function (d) { return d[1]; })),
      range: range,
      data: values.map(function(entry) {
        return { date: new Date(entry[0]), value: entry[1] };
      })
    });

    drawBoxChart($('#box-recovered .contains-chart'), {
      domain: computeDomain(values.map(function (d) { return d[2]; })),
      range: range,
      data: values.map(function(entry) {
        return { date: new Date(entry[0]), value: entry[2] };
      })
    });

    drawBoxChart($('#box-deceased .contains-chart'), {
      domain: computeDomain(values.map(function (d) { return d[3]; })),
      range: range,
      data: values.map(function(entry) {
        return { date: new Date(entry[0]), value: entry[3] };
      })
    });
  }

  function renderTrendChart(data) {
    drawTrendChart($('#trend'), {
      data: data.timeline.map(function(entry) {
        return {
          date: new Date(entry[0]),
          positives: entry[1],
          recovered: entry[2],
          deceased: entry[3]
        };
      })
    });
  }

  function renderDrilldownCharts(data) {
    drawDrilldownChart($('#drilldown-positives'), {
      title: globalConfiguration.labels.drilldownPositivesTitle,
      data: data.children.map(function(entry) {
        return {
          name: entry.name,
          total: entry.positives.total,
          delta: entry.positives.delta
        };
      }),
      sortBy: $('#drilldown-positives .header nav a.is-selected').attr('data-sortby')
    });

    drawDrilldownChart($('#drilldown-recovered'), {
      title: globalConfiguration.labels.drilldownRecoveredTitle,
      data: data.children.map(function(entry) {
        return {
          name: entry.name,
          total: entry.recovered.total,
          delta: entry.recovered.delta
        };
      }),
      sortBy: $('#drilldown-recovered .header nav a.is-selected').attr('data-sortby')
    });

    drawDrilldownChart($('#drilldown-deceased'), {
      title: globalConfiguration.labels.drilldownDeceasedTitle,
      data: data.children.map(function(entry) {
        return {
          name: entry.name,
          total: entry.deceased.total,
          delta: entry.deceased.delta
        };
      }),
      sortBy: $('#drilldown-deceased .header nav a.is-selected').attr('data-sortby')
    });
  }

  function render(data) {
    currentDataset = data;

    if (currentDataset.type === 'country') {
      $('#navigation nav ul li a').removeClass('is-active');
    }

    renderBoxCharts(data);

    $('#totals .updated').text(sprintf(globalConfiguration.labels.differenceFromPreviousUpdate, moment('20200224').format('D MMMM YYYY')));

    $('#totals .positives .value').attr('data-number', data.positives.total);
    $('#totals .positives .value').text(numeral(data.positives.total).format());

    $('#totals .recovered .value').attr('data-number', data.recovered.total);
    $('#totals .recovered .value').text(numeral(data.recovered.total).format());

    $('#totals .deceased .value').attr('data-number', data.deceased.total);
    $('#totals .deceased .value').text(numeral(data.deceased.total).format());

    $('#deltas .positives .value').text(numeral(data.positives.delta).format());
    $('#deltas .positives .value').attr('data-number', data.positives.delta);

    $('#deltas .recovered .value').attr('data-number', data.recovered.delta);
    $('#deltas .recovered .value').text(numeral(data.recovered.delta).format());

    $('#deltas .deceased .value').attr('data-number', data.deceased.delta);
    $('#deltas .deceased .value').text(numeral(data.deceased.delta).format());

    $('#deltas .updated').text(sprintf(globalConfiguration.labels.differenceFromPreviousUpdate, moment(data.updates.previous).format('D MMMM YYYY')));

    $('#swabs-total .value').attr('data-number', data.swabs.total);
    $('#swabs-total .value').text(numeral(data.swabs.total).format());

    $('#swabs-positives .value .number').attr('data-number', (data.positives.total / data.swabs.total) * 100);
    $('#swabs-positives .value .number').text(numeral((data.positives.total / data.swabs.total) * 100).format());

    renderTrendChart(data);

    renderDrilldownCharts(data);

    $('*[data-number]').each(function (e) {
      var number = parseFloat($(this).attr('data-number'));
      var prefix = ($(this).data('sign') === true || $(this).data('sign') === 'true') ? (number !== 0 ? (number < 0 ? '-' : '+') : '') : '';

      var numberStep = function (now, tween) {
        $(tween.elem).text(prefix + numeral(now).format());
      };

      if (!Number.isInteger(number)) {
        number = number * Math.pow(10, 2);

        numberStep = function (now, tween) {
          $(tween.elem).text(prefix + (Math.floor(now) / Math.pow(10, 2)).toFixed(2).toString().replace('.', globalConfiguration.delimiters.decimal));
        };
      }

      $(this).animateNumber({
        number: number,
        numberStep: numberStep
      }, {
        easing: 'swing',
        duration: 500 + Math.round(Math.random() * 500)
      });
    });
  }

  function navigateTo(data) {
    $('header .context ul li').not(':first').remove();

    if (data.type === 'state') {
      var child = $('<li><a href="#"></a></li>');

      child.find('a')
        .data('data', data)
        .text(_.isString(data.name) ? data.name : data.name[globalConfiguration.language]);

      $('header .context ul').append(child);
    }

    render(data);
  }

  moment.locale(globalConfiguration.language);

  numeral.register('locale', globalConfiguration.language, {
    delimiters: globalConfiguration.delimiters
  });

  numeral.locale(globalConfiguration.language);

  $('#drilldown-navigation-positives').on('click', function (e) {
    $('#drilldown-navigation nav ul li a').removeClass('is-active');
    $('.drilldown').removeClass('is-active');

    $(this).addClass('is-active');
    $('#drilldown-positives').addClass('is-active');

    trackEvent('drilldown', 'select', 'positives');

    return false;
  });

  $('#drilldown-navigation-deceased').on('click', function (e) {
    $('#drilldown-navigation nav ul li a').removeClass('is-active');
    $('.drilldown').removeClass('is-active');

    $(this).addClass('is-active');
    $('#drilldown-deceased').addClass('is-active');

    trackEvent('drilldown', 'select', 'deceased');

    return false;
  });

  $('#drilldown-navigation-recovered').on('click', function (e) {
    $('#drilldown-navigation nav ul li a').removeClass('is-active');
    $('.drilldown').removeClass('is-active');

    $(this).addClass('is-active');
    $('#drilldown-recovered').addClass('is-active');

    trackEvent('drilldown', 'select', 'recovered');

    return false;
  });

  $('#drilldown-navigation-all').on('click', function (e) {
    $('#drilldown-navigation nav ul li a').removeClass('is-active');

    $(this).addClass('is-active');
    $('.drilldown').addClass('is-active');

    trackEvent('drilldown', 'select', 'All');

    return false;
  });

  $('#drilldown-positives .header nav a').on('click', function (e) {
    $(this).closest('.drilldown').find('.header nav a').removeClass('is-selected');

    $(this).addClass('is-selected');

    drawDrilldownChart($('#drilldown-positives'), {
      title: globalConfiguration.labels.drilldownPositivesTitle,
      data: currentDataset.children.map(function(entry) {
        return {
          name: entry.name,
          total: entry.positives.total,
          delta: entry.positives.delta
        };
      }),
      sortBy: $(this).attr('data-sortby')
    });

    trackEvent('drilldown', 'sort_by', 'positives', $(this).attr('data-sortby'));

    return false;
  });

  $('#drilldown-recovered .header nav a').on('click', function (e) {
    $(this).closest('.drilldown').find('.header nav a').removeClass('is-selected');

    $(this).addClass('is-selected');

    drawDrilldownChart($('#drilldown-recovered'), {
      title: globalConfiguration.labels.drilldownRecoveredTitle,
      data: currentDataset.children.map(function(entry) {
        return {
          name: entry.name,
          total: entry.recovered.total,
          delta: entry.recovered.delta
        };
      }),
      sortBy: $(this).attr('data-sortby')
    });

    trackEvent('drilldown', 'sort_by', 'recovered', $(this).attr('data-sortby'));

    return false;
  });

  $('#drilldown-deceased .header nav a').on('click', function (e) {
    $(this).closest('.drilldown').find('.header nav a').removeClass('is-selected');

    $(this).addClass('is-selected');

    drawDrilldownChart($('#drilldown-deceased'), {
      title: globalConfiguration.labels.drilldownDeceasedTitle,
      data: currentDataset.children.map(function(entry) {
        return {
          name: entry.name,
          total: entry.deceased.total,
          delta: entry.deceased.delta
        };
      }),
      sortBy: $(this).attr('data-sortby')
    });

    trackEvent('drilldown', 'sort_by', 'deceased', $(this).attr('data-sortby'));

    return false;
  });

  $(document).on('click', 'header .context ul li a', function(e) {
    navigateTo($(this).data('data'));

    trackEvent('breadcrumb', 'select', $(this).text());

    return false;
  });

  $(document).on('click', '#navigation nav ul li a', function (e) {
    $(this).toggleClass('is-active');

    var stateKey = $(this).data('state');
    var stateName = $(this).text();
    var drillDown = $(this).hasClass('is-active');

    var locations = [];

    var n = Math.round(Math.random() * 10) + 3;
    for (var i = 0; i < n; i++) {
      locations.push($(this).text() + ' #' + (i + 1));
    }

    $('#navigation nav ul li a').removeClass('is-active');

    if (drillDown) {
      $(this).addClass('is-active');

      var filteredStates = dataset.children.filter(function(d) {
        return d.name === stateKey;
      });

      navigateTo(filteredStates[0]);

      trackEvent('navigation', 'select', stateName);
    } else {
      navigateTo(dataset);

      trackEvent('navigation', 'clear');
    }
  });

  $(window).on('resize', _.debounce(function(e) {
    renderBoxCharts(currentDataset);
    renderTrendChart(currentDataset);
  }, 100));

  $.getJSON(globalConfiguration.basePath + '/data/dataset.json?' + Math.round(new Date().getTime() / 1000), function(data) {
    dataset = data['ITA'];

    setup(dataset);
    navigateTo(dataset);

    $('#loader').fadeOut(500).remove();
  });

});