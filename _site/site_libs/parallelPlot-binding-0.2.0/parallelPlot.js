/* eslint-disable */
// @ts-nocheck
HTMLWidgets.widget({

    name: "parallelPlot",

    type: "output",

    factory: function(el, width, height) {
        function js2RIndex(index) {
            return (index !== null) ? index + 1 : index;
        }

        function r2JsIndex(index) {
            return (index !== null) ? index - 1 : index;
        }

        const parallelPlot = new pp.ParallelPlot(el.id, width, height);

        return {
            renderValue: function(config) {
                // Add a reference to the widget from the HTML element
                document.getElementById(parallelPlot.id()).widget = this;

                // If htmlwidget is included in Shiny app, listen JavaScript messages sent from Shiny
                if (HTMLWidgets.shinyMode) {
                    ["setContinuousColorScale", "setCategoricalColorScale", "setHistoVisibility", "setInvertedAxes", "setCutoffs", "setKeptColumns", "getValue", "changeRow", "getPlotConfig"].forEach(func => {
                        Shiny.addCustomMessageHandler("parallelPlot:" + func, function(message) {
                            var el = document.getElementById(message.id);
                            if (el) {
                                el.widget[func](message);
                            }
                        });
                    });

                    // Listen event sent by the parallelPlot
                    const eventInputId = config.eventInputId !== null ? config.eventInputId : pp.ParallelPlot.PLOT_EVENT;
                    parallelPlot.on(pp.ParallelPlot.PLOT_EVENT, function (event) {
                        if (event.type === pp.ParallelPlot.EDITION_EVENT) {
                            event.value.rowIndex = js2RIndex(event.value.rowIndex);
                        }
                        if (event.type === pp.ParallelPlot.CUTOFF_EVENT) {
                            event.value.selectedTraces = event.value.selectedTraces.map(js2RIndex);
                        }
                        // Forward 'event' to Shiny through the reactive input 'eventInputId'
                        Shiny.setInputValue(eventInputId, event, {priority: "event"});
                    });
                }

                const controlWidgets = (config.controlWidgets === null) 
                    ? !HTMLWidgets.shinyMode : 
                    config.controlWidgets;

                const sliderPosition = config.sliderPosition
                    ? {}
                    : null;
                if (sliderPosition !== null) {
                    if (typeof config.sliderPosition.dimCount === "number") {
                        sliderPosition.dimCount = config.sliderPosition.dimCount
                    }
                    if (typeof config.sliderPosition.startingDimIndex === "number") {
                        sliderPosition.startingDimIndex = r2JsIndex(config.sliderPosition.startingDimIndex)
                    }
                }

                parallelPlot.generate({
                    data: HTMLWidgets.dataframeToD3(config.data),
                    rowLabels: config.rowLabels,
                    categorical: config.categorical,
                    inputColumns: config.inputColumns,
                    keptColumns: config.keptColumns,
                    histoVisibility : config.histoVisibility,
                    invertedAxes : config.invertedAxes,
                    cutoffs: config.cutoffs,
                    refRowIndex : r2JsIndex(config.refRowIndex),
                    refColumnDim : config.refColumnDim,
                    rotateTitle : config.rotateTitle,
                    columnLabels : config.columnLabels,
                    continuousCS : config.continuousCS,
                    categoricalCS : config.categoricalCS,
                    editionMode : config.editionMode,
                    controlWidgets: controlWidgets,
                    cssRules: config.cssRules,
                    sliderPosition: sliderPosition
                });
            }, // End 'renderValue'

            setContinuousColorScale: function(params) {
                parallelPlot.setContinuousColorScale(params.continuousCsId);
            },

            setCategoricalColorScale: function(params) {
                parallelPlot.setCategoricalColorScale(params.categoricalCsId);
            },

            setHistoVisibility: function(params) {
                parallelPlot.setHistoVisibility(params.histoVisibility);
            },

            setInvertedAxes: function(params) {
                parallelPlot.setInvertedAxes(params.invertedAxes);
            },

            setCutoffs: function(params) {
                parallelPlot.setCutoffs(params.cutoffs);
            },

            setKeptColumns: function(params) {
                parallelPlot.setKeptColumns(params.keptColumns);
            },

            getValue: function(params) {
                if (HTMLWidgets.shinyMode) {
                    let value = parallelPlot.getValue(params.attrType);
                    if (params.attrType === pp.ParallelPlot.ST_ATTR_TYPE) {
                        value = value.map(js2RIndex);
                    }
                    if (value === null) {
                        // TODO: Find how to manage 'null' value
                        value = "NULL";
                    }
                    Shiny.setInputValue(params.valueInputId, value, {priority: "event"});
                }
            },

            changeRow: function(params) {
                parallelPlot.changeRow(r2JsIndex(params.rowIndex), params.newValues);
            },

            getPlotConfig: function(params) {
                if (HTMLWidgets.shinyMode) {
                    const plotConfig = parallelPlot.getPlotConfig();
                    plotConfig.refRowIndex = js2RIndex(plotConfig.refRowIndex);
                    plotConfig.sliderPosition.startingDimIndex = js2RIndex(plotConfig.sliderPosition.startingDimIndex);
                    Shiny.setInputValue(params.configInputId, plotConfig, {priority: "event"});
                }
            },

            resize: function(width, height) {
                parallelPlot.resize(width, height);
            }
        };
    } // End 'factory'
});
