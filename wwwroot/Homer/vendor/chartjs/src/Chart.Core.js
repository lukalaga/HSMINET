/*!
 * Chart.js
 * http://chartjs.org/
 * Version: {{ version }}
 *
 * Copyright 2014 Nick Downie
 * Released under the MIT license
 * https://github.com/nnnick/Chart.js/blob/master/LICENSE.md
 */

(function () {
    "use strict";

    //Declare root variable - window in the browser, global on the server
    var root = this,
        previous = root.Chart;

    //Occupy the global variable of Chart, and create a simple base class
    var Chart = function (context) {
        var chart = this;
        this.canvas = context.canvas;

        this.ctx = context;

        //Variables global to the chart
        var width = this.width = context.canvas.width;
        var height = this.height = context.canvas.height;
        this.aspectRatio = this.width / this.height;
        //High pixel density displays - multiply the size of the canvas height/width by the device pixel ratio, then scale.
        helpers.retinaScale(this);

        return this;
    };
    //Globally expose the defaults to allow for user updating/changing
    Chart.defaults = {
        global: {
            // Boolean - Whether to animate the chart
            animation: true,

            // Number - Number of animation steps
            animationSteps: 60,

            // String - Animation easing effect
            animationEasing: "easeOutQuart",

            // Boolean - If we should show the scale at all
            showScale: true,

            // Boolean - If we want to override with a hard coded scale
            scaleOverride: false,

            // ** Required if scaleOverride is true **
            // Number - The number of steps in a hard coded scale
            scaleSteps: null,
            // Number - The value jump in the hard coded scale
            scaleStepWidth: null,
            // Number - The scale starting value
            scaleStartValue: null,

            // String - Colour of the scale line
            scaleLineColor: "rgba(0,0,0,.1)",

            // Number - Pixel width of the scale line
            scaleLineWidth: 1,

            // Boolean - Whether to show labels on the scale
            scaleShowLabels: true,

            // Interpolated JS string - can access value
            scaleLabel: "<%=value%>",

            // Boolean - Whether the scale should stick to integers, and not show any floats even if drawing space is there
            scaleIntegersOnly: true,

            // Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
            scaleBeginAtZero: false,

            // String - Scale label font declaration for the scale label
            scaleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

            // Number - Scale label font size in pixels
            scaleFontSize: 12,

            // String - Scale label font weight style
            scaleFontStyle: "normal",

            // String - Scale label font colour
            scaleFontColor: "#666",

            // Boolean - whether or not the chart should be responsive and resize when the browser does.
            responsive: false,

            // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
            maintainAspectRatio: true,

            // Boolean - Determines whether to draw tooltips on the canvas or not - attaches events to touchmove & mousemove
            showTooltips: true,

            // Array - Array of string names to attach tooltip events
            tooltipEvents: ["mousemove", "touchstart", "touchmove", "mouseout"],

            // String - Tooltip background colour
            tooltipFillColor: "rgba(0,0,0,0.8)",

            // String - Tooltip label font declaration for the scale label
            tooltipFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

            // Number - Tooltip label font size in pixels
            tooltipFontSize: 14,

            // String - Tooltip font weight style
            tooltipFontStyle: "normal",

            // String - Tooltip label font colour
            tooltipFontColor: "#fff",

            // String - Tooltip title font declaration for the scale label
            tooltipTitleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

            // Number - Tooltip title font size in pixels
            tooltipTitleFontSize: 14,

            // String - Tooltip title font weight style
            tooltipTitleFontStyle: "bold",

            // String - Tooltip title font colour
            tooltipTitleFontColor: "#fff",

            // Number - pixel width of padding around tooltip text
            tooltipYPadding: 6,

            // Number - pixel width of padding around tooltip text
            tooltipXPadding: 6,

            // Number - Size of the caret on the tooltip
            tooltipCaretSize: 8,

            // Number - Pixel radius of the tooltip border
            tooltipCornerRadius: 6,

            // Number - Pixel offset from point x to tooltip edge
            tooltipXOffset: 10,

            // String - Template string for single tooltips
            tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>",

            // String - Template string for single tooltips
            multiTooltipTemplate: "<%= value %>",

            // String - Colour behind the legend colour block
            multiTooltipKeyBackground: '#fff',

            // Function - Will fire on animation progression.
            onAnimationProgress: function () { },

            // Function - Will fire on animation completion.
            onAnimationComplete: function () { }
        }
    };

    //Create a dictionary of chart types, to allow for extension of existing types
    Chart.types = {};

    //Global Chart helpers object for utility methods and classes
    var helpers = Chart.helpers = {};

    //-- Basic js utility methods
    var each = helpers.each = function (loopable, callback, self) {
        var additionalArgs = Array.prototype.slice.call(arguments, 3);
        // Check to see if null or undefined firstly.
        if (loopable) {
            if (loopable.length === +loopable.length) {
                var i;
                for (i = 0; i < loopable.length; i++) {
                    callback.apply(self, [loopable[i], i].concat(additionalArgs));
                }
            }
            else {
                for (var item in loopable) {
                    callback.apply(self, [loopable[item], item].concat(additionalArgs));
                }
            }
        }
    },
        clone = helpers.clone = function (obj) {
            var objClone = {};
            each(obj, function (value, key) {
                if (obj.hasOwnProperty(key)) objClone[key] = value;
            });
            return objClone;
        },
        extend = helpers.extend = function (base) {
            each(Array.prototype.slice.call(arguments, 1), function (extensionObject) {
                each(extensionObject, function (value, key) {
                    if (extensionObject.hasOwnProperty(key)) base[key] = value;
                });
            });
            return base;
        },
        merge = helpers.merge = function (base, master) {
            //Merge properties in left object over to a shallow clone of object right.
            var args = Array.prototype.slice.call(arguments, 0);
            args.unshift({});
            return extend.apply(null, args);
        },
        indexOf = helpers.indexOf = function (arrayToSearch, item) {
            if (Array.prototype.indexOf) {
                return arrayToSearch.indexOf(item);
            }
            else {
                for (var i = 0; i < arrayToSearch.length; i++) {
                    if (arrayToSearch[i] === item) return i;
                }
                return -1;
            }
        },
        inherits = helpers.inherits = function (extensions) {
            //Basic javascript inheritance based on the model created in Backbone.js
            var parent = this;
            var ChartElement = (extensions && extensions.hasOwnProperty("constructor")) ? extensions.constructor : function () { return parent.apply(this, arguments); };

            var Surrogate = function () { this.constructor = ChartElement; };
            Surrogate.prototype = parent.prototype;
            ChartElement.prototype = new Surrogate();

            ChartElement.extend = inherits;

            if (extensions) extend(ChartElement.prototype, extensions);

            ChartElement.__super__ = parent.prototype;

            return ChartElement;
        },
        noop = helpers.noop = function () { },
        uid = helpers.uid = (function () {
            var id = 0;
            return function () {
                return "chart-" + id++;
            };
        })(),
        warn = helpers.warn = function (str) {
            //Method for warning of errors
            if (window.console && typeof window.console.warn == "function") console.warn(str);
        },
        amd = helpers.amd = (typeof root.define == 'function' && root.define.amd),
        //-- Math methods
        isNumber = helpers.isNumber = function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },
        max = helpers.max = function (array) {
            return Math.max.apply(Math, array);
        },
        min = helpers.min = function (array) {
            return Math.min.apply(Math, array);
        },
        cap = helpers.cap = function (valueToCap, maxValue, minValue) {
            if (isNumber(maxValue)) {
                if (valueToCap > maxValue) {
                    return maxValue;
                }
            }
            else if (isNumber(minValue)) {
                if (valueToCap < minValue) {
                    return minValue;
                }
            }
            return valueToCap;
        },
        getDecimalPlaces = helpers.getDecimalPlaces = function (num) {
            if (num % 1 !== 0 && isNumber(num)) {
                return num.toString().split(".")[1].length;
            }
            else {
                return 0;
            }
        },
        toRadians = helpers.radians = function (degrees) {
            return degrees * (Math.PI / 180);
        },
        // Gets the angle from vertical upright to the point about a centre.
        getAngleFromPoint = helpers.getAngleFromPoint = function (centrePoint, anglePoint) {
            var distanceFromXCenter = anglePoint.x - centrePoint.x,
                distanceFromYCenter = anglePoint.y - centrePoint.y,
                radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);

            var angle = Math.PI * 2 + Math.atan2(distanceFromYCenter, distanceFromXCenter);

            //If the segment is in the top left quadrant, we need to add another rotation to the angle
            if (distanceFromXCenter < 0 && distanceFromYCenter < 0) {
                angle += Math.PI * 2;
            }

            return {
                angle: angle,
                distance: radialDistanceFromCenter
            };
        },
        aliasPixel = helpers.aliasPixel = function (pixelWidth) {
            return (pixelWidth % 2 === 0) ? 0 : 0.5;
        },
        splineCurve = helpers.splineCurve = function (FirstPoint, MiddlePoint, AfterPoint, t) {
            //Props to Rob Spencer at scaled innovation for his post on splining between points
            //http://scaledinnovation.com/analytics/splines/aboutSplines.html
            var d01 = Math.sqrt(Math.pow(MiddlePoint.x - FirstPoint.x, 2) + Math.pow(MiddlePoint.y - FirstPoint.y, 2)),
                d12 = Math.sqrt(Math.pow(AfterPoint.x - MiddlePoint.x, 2) + Math.pow(AfterPoint.y - MiddlePoint.y, 2)),
                fa = t * d01 / (d01 + d12),// scaling factor for triangle Ta
                fb = t * d12 / (d01 + d12);
            return {
                inner: {
                    x: MiddlePoint.x - fa * (AfterPoint.x - FirstPoint.x),
                    y: MiddlePoint.y - fa * (AfterPoint.y - FirstPoint.y)
                },
                outer: {
                    x: MiddlePoint.x + fb * (AfterPoint.x - FirstPoint.x),
                    y: MiddlePoint.y + fb * (AfterPoint.y - FirstPoint.y)
                }
            };
        },
        calculateOrderOfMagnitude = helpers.calculateOrderOfMagnitude = function (val) {
            return Math.floor(Math.log(val) / Math.LN10);
        },
        calculateScaleRange = helpers.calculateScaleRange = function (valuesArray, drawingSize, textSize, startFromZero, integersOnly) {
            //Set a minimum step of two - a point at the top of the graph, and a point at the base
            var minSteps = 2,
                maxSteps = Math.floor(drawingSize / (textSize * 1.5)),
                skipFitting = (minSteps >= maxSteps);

            var maxValue = max(valuesArray),
                minValue = min(valuesArray);

            // We need some degree of seperation here to calculate the scales if all the values are the same
            // Adding/minusing 0.5 will give us a range of 1.
            if (maxValue === minValue) {
                maxValue += 0.5;
                // So we don't end up with a graph with a negative start value if we've said always start from zero
                if (minValue >= 0.5 && !startFromZero) {
                    minValue -= 0.5;
                }
                else {
                    // Make up a whole number above the values
                    maxValue += 0.5;
                }
            }

            var valueRange = Math.abs(maxValue - minValue),
                rangeOrderOfMagnitude = calculateOrderOfMagnitude(valueRange),
                graphMax = Math.ceil(maxValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
                graphMin = (startFromZero) ? 0 : Math.floor(minValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
                graphRange = graphMax - graphMin,
                stepValue = Math.pow(10, rangeOrderOfMagnitude),
                numberOfSteps = Math.round(graphRange / stepValue);

            //If we have more space on the graph we'll use it to give more definition to the data
            while ((numberOfSteps > maxSteps || (numberOfSteps * 2) < maxSteps) && !skipFitting) {
                if (numberOfSteps > maxSteps) {
                    stepValue *= 2;
                    numberOfSteps = Math.round(graphRange / stepValue);
                    // Don't ever deal with a decimal number of steps - cancel fitting and just use the minimum number of steps.
                    if (numberOfSteps % 1 !== 0) {
                        skipFitting = true;
                    }
                }
                //We can fit in double the amount of scale points on the scale
                else {
                    //If user has declared ints only, and the step value isn't a decimal
                    if (integersOnly && rangeOrderOfMagnitude >= 0) {
                        //If the user has said integers only, we need to check that making the scale more granular wouldn't make it a float
                        if (stepValue / 2 % 1 === 0) {
                            stepValue /= 2;
                            numberOfSteps = Math.round(graphRange / stepValue);
                        }
                        //If it would make it a float break out of the loop
                        else {
                            break;
                        }
                    }
                    //If the scale doesn't have to be an int, make the scale more granular anyway.
                    else {
                        stepValue /= 2;
                        numberOfSteps = Math.round(graphRange / stepValue);
                    }
                }
            }

            if (skipFitting) {
                numberOfSteps = minSteps;
                stepValue = graphRange / numberOfSteps;
            }

            return {
                steps: numberOfSteps,
                stepValue: stepValue,
                min: graphMin,
                max: graphMin + (numberOfSteps * stepValue)
            };
        },
        /* jshint ignore:start */
        // Blows up jshint errors based on the new Function constructor
        //Templating methods
        //Javascript micro templating by John Resig - source at http://ejohn.org/blog/javascript-micro-templating/
        template = helpers.template = function (templateString, valuesObject) {
            // If templateString is function rather than string-template - call the function for valuesObject
            if (templateString instanceof Function) {
                return templateString(valuesObject);
            }

            var cache = {};
            function tmpl(str, data) {
                // Figure out if we're getting a template, or if we need to
                // load the template - and be sure to cache the result.
                var fn = !/\W/.test(str) ?
                    cache[str] = cache[str] :

                    // Generate a reusable function that will serve as a template
                    // generator (and which will be cached).
                    new Function("obj",
                        "var p=[],print=function(){p.push.apply(p,arguments);};" +

                        // Introduce the data as local variables using with(){}
                        "with(obj){p.push('" +

                        // Convert the template into pure JavaScript
                        str
                            .replace(/[\r\t\n]/g, " ")
                            .split("<%").join("\t")
                            .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                            .replace(/\t=(.*?)%>/g, "',$1,'")
                            .split("\t").join("');")
                            .split("%>").join("p.push('")
                            .split("\r").join("\\'") +
                        "');}return p.join('');"
                    );

                // Provide some basic currying to the user
                return data ? fn(data) : fn;
            }
            return tmpl(templateString, valuesObject);
        },
        /* jshint ignore:end */
        generateLabels = helpers.generateLabels = function (templateString, numberOfSteps, graphMin, stepValue) {
            var labelsArray = new Array(numberOfSteps);
            if (labelTemplateString) {
                each(labelsArray, function (val, index) {
                    labelsArray[index] = template(templateString, { value: (graphMin + (stepValue * (index + 1))) });
                });
            }
            return labelsArray;
        },
        //--Animation methods
        //Easing functions adapted from Robert Penner's easing equations
        //http://www.robertpenner.com/easing/
        easingEffects = helpers.easingEffects = {
            linear: function (t) {
                return t;
            },
            easeInQuad: function (t) {
                return t * t;
            },
            easeOutQuad: function (t) {
                return -1 * t * (t - 2);
            },
            easeInOutQuad: function (t) {
                if ((t /= 1 / 2) < 1) return 1 / 2 * t * t;
                return -1 / 2 * ((--t) * (t - 2) - 1);
            },
            easeInCubic: function (t) {
                return t * t * t;
            },
            easeOutCubic: function (t) {
                return 1 * ((t = t / 1 - 1) * t * t + 1);
            },
            easeInOutCubic: function (t) {
                if ((t /= 1 / 2) < 1) return 1 / 2 * t * t * t;
                return 1 / 2 * ((t -= 2) * t * t + 2);
            },
            easeInQuart: function (t) {
                return t * t * t * t;
            },
            easeOutQuart: function (t) {
                return -1 * ((t = t / 1 - 1) * t * t * t - 1);
            },
            easeInOutQuart: function (t) {
                if ((t /= 1 / 2) < 1) return 1 / 2 * t * t * t * t;
                return -1 / 2 * ((t -= 2) * t * t * t - 2);
            },
            easeInQuint: function (t) {
                return 1 * (t /= 1) * t * t * t * t;
            },
            easeOutQuint: function (t) {
                return 1 * ((t = t / 1 - 1) * t * t * t * t + 1);
            },
            easeInOutQuint: function (t) {
                if ((t /= 1 / 2) < 1) return 1 / 2 * t * t * t * t * t;
                return 1 / 2 * ((t -= 2) * t * t * t * t + 2);
            },
            easeInSine: function (t) {
                return -1 * Math.cos(t / 1 * (Math.PI / 2)) + 1;
            },
            easeOutSine: function (t) {
                return 1 * Math.sin(t / 1 * (Math.PI / 2));
            },
            easeInOutSine: function (t) {
                return -1 / 2 * (Math.cos(Math.PI * t / 1) - 1);
            },
            easeInExpo: function (t) {
                return (t === 0) ? 1 : 1 * Math.pow(2, 10 * (t / 1 - 1));
            },
            easeOutExpo: function (t) {
                return (t === 1) ? 1 : 1 * (-Math.pow(2, -10 * t / 1) + 1);
            },
            easeInOutExpo: function (t) {
                if (t === 0) return 0;
                if (t === 1) return 1;
                if ((t /= 1 / 2) < 1) return 1 / 2 * Math.pow(2, 10 * (t - 1));
                return 1 / 2 * (-Math.pow(2, -10 * --t) + 2);
            },
            easeInCirc: function (t) {
                if (t >= 1) return t;
                return -1 * (Math.sqrt(1 - (t /= 1) * t) - 1);
            },
            easeOutCirc: function (t) {
                return 1 * Math.sqrt(1 - (t = t / 1 - 1) * t);
            },
            easeInOutCirc: function (t) {
                if ((t /= 1 / 2) < 1) return -1 / 2 * (Math.sqrt(1 - t * t) - 1);
                return 1 / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1);
            },
            easeInElastic: function (t) {
                var s = 1.70158;
                var p = 0;
                var a = 1;
                if (t === 0) return 0;
                if ((t /= 1) == 1) return 1;
                if (!p) p = 1 * 0.3;
                if (a < Math.abs(1)) {
                    a = 1;
                    s = p / 4;
                } else s = p / (2 * Math.PI) * Math.asin(1 / a);
                return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * 1 - s) * (2 * Math.PI) / p));
            },
            easeOutElastic: function (t) {
                var s = 1.70158;
                var p = 0;
                var a = 1;
                if (t === 0) return 0;
                if ((t /= 1) == 1) return 1;
                if (!p) p = 1 * 0.3;
                if (a < Math.abs(1)) {
                    a = 1;
                    s = p / 4;
                } else s = p / (2 * Math.PI) * Math.asin(1 / a);
                return a * Math.pow(2, -10 * t) * Math.sin((t * 1 - s) * (2 * Math.PI) / p) + 1;
            },
            easeInOutElastic: function (t) {
                var s = 1.70158;
                var p = 0;
                var a = 1;
                if (t === 0) return 0;
                if ((t /= 1 / 2) == 2) return 1;
                if (!p) p = 1 * (0.3 * 1.5);
                if (a < Math.abs(1)) {
                    a = 1;
                    s = p / 4;
                } else s = p / (2 * Math.PI) * Math.asin(1 / a);
                if (t < 1) return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * 1 - s) * (2 * Math.PI) / p));
                return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * 1 - s) * (2 * Math.PI) / p) * 0.5 + 1;
            },
            easeInBack: function (t) {
                var s = 1.70158;
                return 1 * (t /= 1) * t * ((s + 1) * t - s);
            },
            easeOutBack: function (t) {
                var s = 1.70158;
                return 1 * ((t = t / 1 - 1) * t * ((s + 1) * t + s) + 1);
            },
            easeInOutBack: function (t) {
                var s = 1.70158;
                if ((t /= 1 / 2) < 1) return 1 / 2 * (t * t * (((s *= (1.525)) + 1) * t - s));
                return 1 / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2);
            },
            easeInBounce: function (t) {
                return 1 - easingEffects.easeOutBounce(1 - t);
            },
            easeOutBounce: function (t) {
                if ((t /= 1) < (1 / 2.75)) {
                    return 1 * (7.5625 * t * t);
                } else if (t < (2 / 2.75)) {
                    return 1 * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75);
                } else if (t < (2.5 / 2.75)) {
                    return 1 * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375);
                } else {
                    return 1 * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375);
                }
            },
            easeInOutBounce: function (t) {
                if (t < 1 / 2) return easingEffects.easeInBounce(t * 2) * 0.5;
                return easingEffects.easeOutBounce(t * 2 - 1) * 0.5 + 1 * 0.5;
            }
        },
        //Request animation polyfill - http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
        requestAnimFrame = helpers.requestAnimFrame = (function () {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function (callback) {
                    return window.setTimeout(callback, 1000 / 60);
                };
        })(),
        cancelAnimFrame = helpers.cancelAnimFrame = (function () {
            return window.cancelAnimationFrame ||
                window.webkitCancelAnimationFrame ||
                window.mozCancelAnimationFrame ||
                window.oCancelAnimationFrame ||
                window.msCancelAnimationFrame ||
                function (callback) {
                    return window.clearTimeout(callback, 1000 / 60);
                };
        })(),
        animationLoop = helpers.animationLoop = function (callback, totalSteps, easingString, onProgress, onComplete, chartInstance) {
            var currentStep = 0,
                easingFunction = easingEffects[easingString] || easingEffects.linear;

            var animationFrame = function () {
                currentStep++;
                var stepDecimal = currentStep / totalSteps;
                var easeDecimal = easingFunction(stepDecimal);

                callback.call(chartInstance, easeDecimal, stepDecimal, currentStep);
                onProgress.call(chartInstance, easeDecimal, stepDecimal);
                if (currentStep < totalSteps) {
                    chartInstance.animationFrame = requestAnimFrame(animationFrame);
                } else {
                    onComplete.apply(chartInstance);
                }
            };
            requestAnimFrame(animationFrame);
        },
        //-- DOM methods
        getRelativePosition = helpers.getRelativePosition = function (evt) {
            var mouseX, mouseY;
            var e = evt.originalEvent || evt,
                canvas = evt.currentTarget || evt.srcElement,
                boundingRect = canvas.getBoundingClientRect();

            if (e.touches) {
                mouseX = e.touches[0].clientX - boundingRect.left;
                mouseY = e.touches[0].clientY - boundingRect.top;
            }
            else {
                mouseX = e.clientX - boundingRect.left;
                mouseY = e.clientY - boundingRect.top;
            }

            return {
                x: mouseX,
                y: mouseY
            };
        },
        addEvent = helpers.addEvent = function (node, eventType, method) {
            if (node.addEventListener) {
                node.addEventListener(eventType, method);
            } else if (node.attachEvent) {
                node.attachEvent("on" + eventType, method);
            } else {
                node["on" + eventType] = method;
            }
        },
        removeEvent = helpers.removeEvent = function (node, eventType, handler) {
            if (node.removeEventListener) {
                node.removeEventListener(eventType, handler, false);
            } else if (node.detachEvent) {
                node.detachEvent("on" + eventType, handler);
            } else {
                node["on" + eventType] = noop;
            }
        },
        bindEvents = helpers.bindEvents = function (chartInstance, arrayOfEvents, handler) {
            // Create the events object if it's not already present
            if (!chartInstance.events) chartInstance.events = {};

            each(arrayOfEvents, function (eventName) {
                chartInstance.events[eventName] = function () {
                    handler.apply(chartInstance, arguments);
                };
                addEvent(chartInstance.chart.canvas, eventName, chartInstance.events[eventName]);
            });
        },
        unbindEvents = helpers.unbindEvents = function (chartInstance, arrayOfEvents) {
            each(arrayOfEvents, function (handler, eventName) {
                removeEvent(chartInstance.chart.canvas, eventName, handler);
            });
        },
        getMaximumWidth = helpers.getMaximumWidth = function (domNode) {
            var container = domNode.parentNode;
            // TODO = check cross browser stuff with this.
            return container.clientWidth;
        },
        getMaximumHeight = helpers.getMaximumHeight = function (domNode) {
            var container = domNode.parentNode;
            // TODO = check cross browser stuff with this.
            return container.clientHeight;
        },
        getMaximumSize = helpers.getMaximumSize = helpers.getMaximumWidth, // legacy support
        retinaScale = helpers.retinaScale = function (chart) {
            var ctx = chart.ctx,
                width = chart.canvas.width,
                height = chart.canvas.height;
            //console.log(width + " x " + height);
            if (window.devicePixelRatio) {
                ctx.canvas.style.width = width + "px";
                ctx.canvas.style.height = height + "px";
                ctx.canvas.height = height * window.devicePixelRatio;
                ctx.canvas.width = width * window.devicePixelRatio;
                ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            }
        },
        //-- Canvas methods
        clear = helpers.clear = function (chart) {
            chart.ctx.clearRect(0, 0, chart.width, chart.height);
        },
        fontString = helpers.fontString = function (pixelSize, fontStyle, fontFamily) {
            return fontStyle + " " + pixelSize + "px " + fontFamily;
        },
        longestText = helpers.longestText = function (ctx, font, arrayOfStrings) {
            ctx.font = font;
            var longest = 0;
            each(arrayOfStrings, function (string) {
                var textWidth = ctx.measureText(string).width;
                longest = (textWidth > longest) ? textWidth : longest;
            });
            return longest;
        },
        drawRoundedRectangle = helpers.drawRoundedRectangle = function (ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        };

    //Store a reference to each instance - allowing us to globally resize chart instances on window resize.
    //Destroy method on the chart will remove the instance of the chart from this reference.
    Chart.instances = {};

    Chart.Type = function (data, options, chart) {
        this.options = options;
        this.chart = chart;
        this.id = uid();
        //Add the chart instance to the global namespace
        Chart.instances[this.id] = this;

        // Initialize is always called when a chart type is created
        // By default it is a no op, but it should be extended
        if (options.responsive) {
            this.resize();
        }
        this.initialize.call(this, data);
    };

    //Core methods that'll be a part of every chart type
    extend(Chart.Type.prototype, {
        initialize: function () { return this; },
        clear: function () {
            clear(this.chart);
            return this;
        },
        stop: function () {
            // Stops any current animation loop occuring
            helpers.cancelAnimFrame.call(root, this.animationFrame);
            return this;
        },
        resize: function (callback) {
            this.stop();
            var canvas = this.chart.canvas,
                newWidth = getMaximumWidth(this.chart.canvas),
                newHeight = this.options.maintainAspectRatio ? newWidth / this.chart.aspectRatio : getMaximumHeight(this.chart.canvas);

            canvas.width = this.chart.width = newWidth;
            canvas.height = this.chart.height = newHeight;

            retinaScale(this.chart);

            if (typeof callback === "function") {
                callback.apply(this, Array.prototype.slice.call(arguments, 1));
            }
            return this;
        },
        reflow: noop,
        render: function (reflow) {
            if (reflow) {
                this.reflow();
            }
            if (this.options.animation && !reflow) {
                helpers.animationLoop(
                    this.draw,
                    this.options.animationSteps,
                    this.options.animationEasing,
                    this.options.onAnimationProgress,
                    this.options.onAnimationComplete,
                    this
                );
            }
            else {
                this.draw();
                this.options.onAnimationComplete.call(this);
            }
            return this;
        },
        generateLegend: function () {
            return template(this.options.legendTemplate, this);
        },
        destroy: function () {
            this.clear();
            unbindEvents(this, this.events);
            delete Chart.instances[this.id];
        },
        showTooltip: function (ChartElements, forceRedraw) {
            // Only redraw the chart if we've actually changed what we're hovering on.
            if (typeof this.activeElements === 'undefined') this.activeElements = [];

            var isChanged = (function (Elements) {
                var changed = false;

                if (Elements.length !== this.activeElements.length) {
                    changed = true;
                    return changed;
                }

                each(Elements, function (element, index) {
                    if (element !== this.activeElements[index]) {
                        changed = true;
                    }
                }, this);
                return changed;
            }).call(this, ChartElements);

            if (!isChanged && !forceRedraw) {
                return;
            }
            else {
                this.activeElements = ChartElements;
            }
            this.draw();
            if (ChartElements.length > 0) {
                // If we have multiple datasets, show a MultiTooltip for all of the data points at that index
                if (this.datasets && this.datasets.length > 1) {
                    var dataArray,
                        dataIndex;

                    for (var i = this.datasets.length - 1; i >= 0; i--) {
                        dataArray = this.datasets[i].points || this.datasets[i].bars || this.datasets[i].segments;
                        dataIndex = indexOf(dataArray, ChartElements[0]);
                        if (dataIndex !== -1) {
                            break;
                        }
                    }
                    var tooltipLabels = [],
                        tooltipColors = [],
                        medianPosition = (function (index) {
                            // Get all the points at that particular index
                            var Elements = [],
                                dataCollection,
                                xPositions = [],
                                yPositions = [],
                                xMax,
                                yMax,
                                xMin,
                                yMin;
                            helpers.each(this.datasets, function (dataset) {
                                dataCollection = dataset.points || dataset.bars || dataset.segments;
                                if (dataCollection[dataIndex]) {
                                    Elements.push(dataCollection[dataIndex]);
                                }
                            });

                            helpers.each(Elements, function (element) {
                                xPositions.push(element.x);
                                yPositions.push(element.y);

                                //Include any colour information about the element
                                tooltipLabels.push(helpers.template(this.options.multiTooltipTemplate, element));
                                tooltipColors.push({
                                    fill: element._saved.fillColor || element.fillColor,
                                    stroke: element._saved.strokeColor || element.strokeColor
                                });
                            }, this);

                            yMin = min(yPositions);
                            yMax = max(yPositions);

                            xMin = min(xPositions);
                            xMax = max(xPositions);

                            return {
                                x: (xMin > this.chart.width / 2) ? xMin : xMax,
                                y: (yMin + yMax) / 2
                            };
                        }).call(this, dataIndex);

                    new Chart.MultiTooltip({
                        x: medianPosition.x,
                        y: medianPosition.y,
                        xPadding: this.options.tooltipXPadding,
                        yPadding: this.options.tooltipYPadding,
                        xOffset: this.options.tooltipXOffset,
                        fillColor: this.options.tooltipFillColor,
                        textColor: this.options.tooltipFontColor,
                        fontFamily: this.options.tooltipFontFamily,
                        fontStyle: this.options.tooltipFontStyle,
                        fontSize: this.options.tooltipFontSize,
                        titleTextColor: this.options.tooltipTitleFontColor,
                        titleFontFamily: this.options.tooltipTitleFontFamily,
                        titleFontStyle: this.options.tooltipTitleFontStyle,
                        titleFontSize: this.options.tooltipTitleFontSize,
                        cornerRadius: this.options.tooltipCornerRadius,
                        labels: tooltipLabels,
                        legendColors: tooltipColors,
                        legendColorBackground: this.options.multiTooltipKeyBackground,
                        title: ChartElements[0].label,
                        chart: this.chart,
                        ctx: this.chart.ctx
                    }).draw();
                } else {
                    each(ChartElements, function (Element) {
                        var tooltipPosition = Element.tooltipPosition();
                        new Chart.Tooltip({
                            x: Math.round(tooltipPosition.x),
                            y: Math.round(tooltipPosition.y),
                            xPadding: this.options.tooltipXPadding,
                            yPadding: this.options.tooltipYPadding,
                            fillColor: this.options.tooltipFillColor,
                            textColor: this.options.tooltipFontColor,
                            fontFamily: this.options.tooltipFontFamily,
                            fontStyle: this.options.tooltipFontStyle,
                            fontSize: this.options.tooltipFontSize,
                            caretHeight: this.options.tooltipCaretSize,
                            cornerRadius: this.options.tooltipCornerRadius,
                            text: template(this.options.tooltipTemplate, Element),
                            chart: this.chart
                        }).draw();
                    }, this);
                }
            }
            return this;
        },
        toBase64Image: function () {
            return this.chart.canvas.toDataURL.apply(this.chart.canvas, arguments);
        }
    });

    Chart.Type.extend = function (extensions) {
        var parent = this;

        var ChartType = function () {
            return parent.apply(this, arguments);
        };

        //Copy the prototype object of the this class
        ChartType.prototype = clone(parent.prototype);
        //Now overwrite some of the properties in the base class with the new extensions
        extend(ChartType.prototype, extensions);

        ChartType.extend = Chart.Type.extend;

        if (extensions.name || parent.prototype.name) {
            var chartName = extensions.name || parent.prototype.name;
            //Assign any potential default values of the new chart type

            //If none are defined, we'll use a clone of the chart type this is being extended from.
            //I.e. if we extend a line chart, we'll use the defaults from the line chart if our new chart
            //doesn't define some defaults of their own.

            var baseDefaults = (Chart.defaults[parent.prototype.name]) ? clone(Chart.defaults[parent.prototype.name]) : {};

            Chart.defaults[chartName] = extend(baseDefaults, extensions.defaults);

            Chart.types[chartName] = ChartType;

            //Register this new chart type in the Chart prototype
            Chart.prototype[chartName] = function (data, options) {
                var config = merge(Chart.defaults.global, Chart.defaults[chartName], options || {});
                return new ChartType(data, config, this);
            };
        } else {
            warn("Name not provided for this chart, so it hasn't been registered");
        }
        return parent;
    };

    Chart.Element = function (configuration) {
        extend(this, configuration);
        this.initialize.apply(this, arguments);
        this.save();
    };
    extend(Chart.Element.prototype, {
        initialize: function () { },
        restore: function (props) {
            if (!props) {
                extend(this, this._saved);
            } else {
                each(props, function (key) {
                    this[key] = this._saved[key];
                }, this);
            }
            return this;
        },
        save: function () {
            this._saved = clone(this);
            delete this._saved._saved;
            return this;
        },
        update: function (newProps) {
            each(newProps, function (value, key) {
                this._saved[key] = this[key];
                this[key] = value;
            }, this);
            return this;
        },
        transition: function (props, ease) {
            each(props, function (value, key) {
                this[key] = ((value - this._saved[key]) * ease) + this._saved[key];
            }, this);
            return this;
        },
        tooltipPosition: function () {
            return {
                x: this.x,
                y: this.y
            };
        }
    });

    Chart.Element.extend = inherits;

    Chart.Point = Chart.Element.extend({
        display: true,
        inRange: function (chartX, chartY) {
            var hitDetectionRange = this.hitDetectionRadius + this.radius;
            return ((Math.pow(chartX - this.x, 2) + Math.pow(chartY - this.y, 2)) < Math.pow(hitDetectionRange, 2));
        },
        draw: function () {
            if (this.display) {
                var ctx = this.ctx;
                ctx.beginPath();

                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.closePath();

                ctx.strokeStyle = this.strokeColor;
                ctx.lineWidth = this.strokeWidth;

                ctx.fillStyle = this.fillColor;

                ctx.fill();
                ctx.stroke();
            }

            //Quick debug for bezier curve splining
            //Highlights control points and the line between them.
            //Handy for dev - stripped in the min version.

            // ctx.save();
            // ctx.fillStyle = "black";
            // ctx.strokeStyle = "black"
            // ctx.beginPath();
            // ctx.arc(this.controlPoints.inner.x,this.controlPoints.inner.y, 2, 0, Math.PI*2);
            // ctx.fill();

            // ctx.beginPath();
            // ctx.arc(this.controlPoints.outer.x,this.controlPoints.outer.y, 2, 0, Math.PI*2);
            // ctx.fill();

            // ctx.moveTo(this.controlPoints.inner.x,this.controlPoints.inner.y);
            // ctx.lineTo(this.controlPoints.outer.x,this.controlPoints.outer.y);
            // ctx.stroke();

            // ctx.restore();
        }
    });

    Chart.Arc = Chart.Element.extend({
        inRange: function (chartX, chartY) {
            var pointRelativePosition = helpers.getAngleFromPoint(this, {
                x: chartX,
                y: chartY
            });

            //Check if within the range of the open/close angle
            var betweenAngles = (pointRelativePosition.angle >= this.startAngle && pointRelativePosition.angle <= this.endAngle),
                withinRadius = (pointRelativePosition.distance >= this.innerRadius && pointRelativePosition.distance <= this.outerRadius);

            return (betweenAngles && withinRadius);
            //Ensure within the outside of the arc centre, but inside arc outer
        },
        tooltipPosition: function () {
            var centreAngle = this.startAngle + ((this.endAngle - this.startAngle) / 2),
                rangeFromCentre = (this.outerRadius - this.innerRadius) / 2 + this.innerRadius;
            return {
                x: this.x + (Math.cos(centreAngle) * rangeFromCentre),
                y: this.y + (Math.sin(centreAngle) * rangeFromCentre)
            };
        },
        draw: function (animationPercent) {
            var easingDecimal = animationPercent || 1;

            var ctx = this.ctx;

            ctx.beginPath();

            ctx.arc(this.x, this.y, this.outerRadius, this.startAngle, this.endAngle);

            ctx.arc(this.x, this.y, this.innerRadius, this.endAngle, this.startAngle, true);

            ctx.closePath();
            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = this.strokeWidth;

            ctx.fillStyle = this.fillColor;

            ctx.fill();
            ctx.lineJoin = 'bevel';

            if (this.showStroke) {
                ctx.stroke();
            }
        }
    });

    Chart.Rectangle = Chart.Element.extend({
        draw: function () {
            var ctx = this.ctx,
                halfWidth = this.width / 2,
                leftX = this.x - halfWidth,
                rightX = this.x + halfWidth,
                top = this.base - (this.base - this.y),
                halfStroke = this.strokeWidth / 2;

            // Canvas doesn't allow us to stroke inside the width so we can
            // adjust the sizes to fit if we're setting a stroke on the line
            if (this.showStroke) {
                leftX += halfStroke;
                rightX -= halfStroke;
                top += halfStroke;
            }

            ctx.beginPath();

            ctx.fillStyle = this.fillColor;
            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = this.strokeWidth;

            // It'd be nice to keep this class totally generic to any rectangle
            // and simply specify which border to miss out.
            ctx.moveTo(leftX, this.base);
            ctx.lineTo(leftX, top);
            ctx.lineTo(rightX, top);
            ctx.lineTo(rightX, this.base);
            ctx.fill();
            if (this.showStroke) {
                ctx.stroke();
            }
        },
        height: function () {
            return this.base - this.y;
        },
        inRange: function (chartX, chartY) {
            return (chartX >= this.x - this.width / 2 && chartX <= this.x + this.width / 2) && (chartY >= this.y && chartY <= this.base);
        }
    });

    Chart.Tooltip = Chart.Element.extend({
        draw: function () {
            var ctx = this.chart.ctx;

            ctx.font = fontString(this.fontSize, this.fontStyle, this.fontFamily);

            this.xAlign = "center";
            this.yAlign = "above";

            //Distance between the actual element.y position and the start of the tooltip caret
            var caretPadding = 2;

            var tooltipWidth = ctx.measureText(this.text).width + 2 * this.xPadding,
                tooltipRectHeight = this.fontSize + 2 * this.yPadding,
                tooltipHeight = tooltipRectHeight + this.caretHeight + caretPadding;

            if (this.x + tooltipWidth / 2 > this.chart.width) {
                this.xAlign = "left";
            } else if (this.x - tooltipWidth / 2 < 0) {
                this.xAlign = "right";
            }

            if (this.y - tooltipHeight < 0) {
                this.yAlign = "below";
            }

            var tooltipX = this.x - tooltipWidth / 2,
                tooltipY = this.y - tooltipHeight;

            ctx.fillStyle = this.fillColor;

            switch (this.yAlign) {
                case "above":
                    //Draw a caret above the x/y
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y - caretPadding);
                    ctx.lineTo(this.x + this.caretHeight, this.y - (caretPadding + this.caretHeight));
                    ctx.lineTo(this.x - this.caretHeight, this.y - (caretPadding + this.caretHeight));
                    ctx.closePath();
                    ctx.fill();
                    break;
                case "below":
                    tooltipY = this.y + caretPadding + this.caretHeight;
                    //Draw a caret below the x/y
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y + caretPadding);
                    ctx.lineTo(this.x + this.caretHeight, this.y + caretPadding + this.caretHeight);
                    ctx.lineTo(this.x - this.caretHeight, this.y + caretPadding + this.caretHeight);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }

            switch (this.xAlign) {
                case "left":
                    tooltipX = this.x - tooltipWidth + (this.cornerRadius + this.caretHeight);
                    break;
                case "right":
                    tooltipX = this.x - (this.cornerRadius + this.caretHeight);
                    break;
            }

            drawRoundedRectangle(ctx, tooltipX, tooltipY, tooltipWidth, tooltipRectHeight, this.cornerRadius);

            ctx.fill();

            ctx.fillStyle = this.textColor;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.text, tooltipX + tooltipWidth / 2, tooltipY + tooltipRectHeight / 2);
        }
    });

    Chart.MultiTooltip = Chart.Element.extend({
        initialize: function () {
            this.font = fontString(this.fontSize, this.fontStyle, this.fontFamily);

            this.titleFont = fontString(this.titleFontSize, this.titleFontStyle, this.titleFontFamily);

            this.height = (this.labels.length * this.fontSize) + ((this.labels.length - 1) * (this.fontSize / 2)) + (this.yPadding * 2) + this.titleFontSize * 1.5;

            this.ctx.font = this.titleFont;

            var titleWidth = this.ctx.measureText(this.title).width,
                //Label has a legend square as well so account for this.
                labelWidth = longestText(this.ctx, this.font, this.labels) + this.fontSize + 3,
                longestTextWidth = max([labelWidth, titleWidth]);

            this.width = longestTextWidth + (this.xPadding * 2);

            var halfHeight = this.height / 2;

            //Check to ensure the height will fit on the canvas
            //The three is to buffer form the very
            if (this.y - halfHeight < 0) {
                this.y = halfHeight;
            } else if (this.y + halfHeight > this.chart.height) {
                this.y = this.chart.height - halfHeight;
            }

            //Decide whether to align left or right based on position on canvas
            if (this.x > this.chart.width / 2) {
                this.x -= this.xOffset + this.width;
            } else {
                this.x += this.xOffset;
            }
        },
        getLineHeight: function (index) {
            var baseLineHeight = this.y - (this.height / 2) + this.yPadding,
                afterTitleIndex = index - 1;

            //If the index is zero, we're getting the title
            if (index === 0) {
                return baseLineHeight + this.titleFontSize / 2;
            } else {
                return baseLineHeight + ((this.fontSize * 1.5 * afterTitleIndex) + this.fontSize / 2) + this.titleFontSize * 1.5;
            }
        },
        draw: function () {
            drawRoundedRectangle(this.ctx, this.x, this.y - this.height / 2, this.width, this.height, this.cornerRadius);
            var ctx = this.ctx;
            ctx.fillStyle = this.fillColor;
            ctx.fill();
            ctx.closePath();

            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = this.titleTextColor;
            ctx.font = this.titleFont;

            ctx.fillText(this.title, this.x + this.xPadding, this.getLineHeight(0));

            ctx.font = this.font;
            helpers.each(this.labels, function (label, index) {
                ctx.fillStyle = this.textColor;
                ctx.fillText(label, this.x + this.xPadding + this.fontSize + 3, this.getLineHeight(index + 1));

                //A bit gnarly, but clearing this rectangle breaks when using explorercanvas (clears whole canvas)
                //ctx.clearRect(this.x + this.xPadding, this.getLineHeight(index + 1) - this.fontSize/2, this.fontSize, this.fontSize);
                //Instead we'll make a white filled block to put the legendColour palette over.

                ctx.fillStyle = this.legendColorBackground;
                ctx.fillRect(this.x + this.xPadding, this.getLineHeight(index + 1) - this.fontSize / 2, this.fontSize, this.fontSize);

                ctx.fillStyle = this.legendColors[index].fill;
                ctx.fillRect(this.x + this.xPadding, this.getLineHeight(index + 1) - this.fontSize / 2, this.fontSize, this.fontSize);
            }, this);
        }
    });

    Chart.Scale = Chart.Element.extend({
        initialize: function () {
            this.fit();
        },
        buildYLabels: function () {
            this.yLabels = [];

            var stepDecimalPlaces = getDecimalPlaces(this.stepValue);

            for (var i = 0; i <= this.steps; i++) {
                this.yLabels.push(template(this.templateString, { value: (this.min + (i * this.stepValue)).toFixed(stepDecimalPlaces) }));
            }
            this.yLabelWidth = (this.display && this.showLabels) ? longestText(this.ctx, this.font, this.yLabels) : 0;
        },
        addXLabel: function (label) {
            this.xLabels.push(label);
            this.valuesCount++;
            this.fit();
        },
        removeXLabel: function () {
            this.xLabels.shift();
            this.valuesCount--;
            this.fit();
        },
        // Fitting loop to rotate x Labels and figure out what fits there, and also calculate how many Y steps to use
        fit: function () {
            // First we need the width of the yLabels, assuming the xLabels aren't rotated

            // To do that we need the base line at the top and base of the chart, assuming there is no x label rotation
            this.startPoint = (this.display) ? this.fontSize : 0;
            this.endPoint = (this.display) ? this.height - (this.fontSize * 1.5) - 5 : this.height; // -5 to pad labels

            // Apply padding settings to the start and end point.
            this.startPoint += this.padding;
            this.endPoint -= this.padding;

            // Cache the starting height, so can determine if we need to recalculate the scale yAxis
            var cachedHeight = this.endPoint - this.startPoint,
                cachedYLabelWidth;

            // Build the current yLabels so we have an idea of what size they'll be to start
			/*
			 *	This sets what is returned from calculateScaleRange as static properties of this class:
			 *
				this.steps;
				this.stepValue;
				this.min;
				this.max;
			 *
			 */
            this.calculateYRange(cachedHeight);

            // With these properties set we can now build the array of yLabels
            // and also the width of the largest yLabel
            this.buildYLabels();

            this.calculateXLabelRotation();

            while ((cachedHeight > this.endPoint - this.startPoint)) {
                cachedHeight = this.endPoint - this.startPoint;
                cachedYLabelWidth = this.yLabelWidth;

                this.calculateYRange(cachedHeight);
                this.buildYLabels();

                // Only go through the xLabel loop again if the yLabel width has changed
                if (cachedYLabelWidth < this.yLabelWidth) {
                    this.calculateXLabelRotation();
                }
            }
        },
        calculateXLabelRotation: function () {
            //Get the width of each grid by calculating the difference
            //between x offsets between 0 and 1.

            this.ctx.font = this.font;

            var firstWidth = this.ctx.measureText(this.xLabels[0]).width,
                lastWidth = this.ctx.measureText(this.xLabels[this.xLabels.length - 1]).width,
                firstRotated,
                lastRotated;

            this.xScalePaddingRight = lastWidth / 2 + 3;
            this.xScalePaddingLeft = (firstWidth / 2 > this.yLabelWidth + 10) ? firstWidth / 2 : this.yLabelWidth + 10;

            this.xLabelRotation = 0;
            if (this.display) {
                var originalLabelWidth = longestText(this.ctx, this.font, this.xLabels),
                    cosRotation,
                    firstRotatedWidth;
                this.xLabelWidth = originalLabelWidth;
                //Allow 3 pixels x2 padding either side for label readability
                var xGridWidth = Math.floor(this.calculateX(1) - this.calculateX(0)) - 6;

                //Max label rotate should be 90 - also act as a loop counter
                while ((this.xLabelWidth > xGridWidth && this.xLabelRotation === 0) || (this.xLabelWidth > xGridWidth && this.xLabelRotation <= 90 && this.xLabelRotation > 0)) {
                    cosRotation = Math.cos(toRadians(this.xLabelRotation));

                    firstRotated = cosRotation * firstWidth;
                    lastRotated = cosRotation * lastWidth;

                    // We're right aligning the text now.
                    if (firstRotated + this.fontSize / 2 > this.yLabelWidth + 8) {
                        this.xScalePaddingLeft = firstRotated + this.fontSize / 2;
                    }
                    this.xScalePaddingRight = this.fontSize / 2;

                    this.xLabelRotation++;
                    this.xLabelWidth = cosRotation * originalLabelWidth;
                }
                if (this.xLabelRotation > 0) {
                    this.endPoint -= Math.sin(toRadians(this.xLabelRotation)) * originalLabelWidth + 3;
                }
            }
            else {
                this.xLabelWidth = 0;
                this.xScalePaddingRight = this.padding;
                this.xScalePaddingLeft = this.padding;
            }
        },
        // Needs to be overidden in each Chart type
        // Otherwise we need to pass all the data into the scale class
        calculateYRange: noop,
        drawingArea: function () {
            return this.startPoint - this.endPoint;
        },
        calculateY: function (value) {
            var scalingFactor = this.drawingArea() / (this.min - this.max);
            return this.endPoint - (scalingFactor * (value - this.min));
        },
        calculateX: function (index) {
            var isRotated = (this.xLabelRotation > 0),
                // innerWidth = (this.offsetGridLines) ? this.width - offsetLeft - this.padding : this.width - (offsetLeft + halfLabelWidth * 2) - this.padding,
                innerWidth = this.width - (this.xScalePaddingLeft + this.xScalePaddingRight),
                valueWidth = innerWidth / (this.valuesCount - ((this.offsetGridLines) ? 0 : 1)),
                valueOffset = (valueWidth * index) + this.xScalePaddingLeft;

            if (this.offsetGridLines) {
                valueOffset += (valueWidth / 2);
            }

            return Math.round(valueOffset);
        },
        update: function (newProps) {
            helpers.extend(this, newProps);
            this.fit();
        },
        draw: function () {
            var ctx = this.ctx,
                yLabelGap = (this.endPoint - this.startPoint) / this.steps,
                xStart = Math.round(this.xScalePaddingLeft);
            if (this.display) {
                ctx.fillStyle = this.textColor;
                ctx.font = this.font;
                each(this.yLabels, function (labelString, index) {
                    var yLabelCenter = this.endPoint - (yLabelGap * index),
                        linePositionY = Math.round(yLabelCenter);

                    ctx.textAlign = "right";
                    ctx.textBaseline = "middle";
                    if (this.showLabels) {
                        ctx.fillText(labelString, xStart - 10, yLabelCenter);
                    }
                    ctx.beginPath();
                    if (index > 0) {
                        // This is a grid line in the centre, so drop that
                        ctx.lineWidth = this.gridLineWidth;
                        ctx.strokeStyle = this.gridLineColor;
                    } else {
                        // This is the first line on the scale
                        ctx.lineWidth = this.lineWidth;
                        ctx.strokeStyle = this.lineColor;
                    }

                    linePositionY += helpers.aliasPixel(ctx.lineWidth);

                    ctx.moveTo(xStart, linePositionY);
                    ctx.lineTo(this.width, linePositionY);
                    ctx.stroke();
                    ctx.closePath();

                    ctx.lineWidth = this.lineWidth;
                    ctx.strokeStyle = this.lineColor;
                    ctx.beginPath();
                    ctx.moveTo(xStart - 5, linePositionY);
                    ctx.lineTo(xStart, linePositionY);
                    ctx.stroke();
                    ctx.closePath();
                }, this);

                each(this.xLabels, function (label, index) {
                    var xPos = this.calculateX(index) + aliasPixel(this.lineWidth),
                        // Check to see if line/bar here and decide where to place the line
                        linePos = this.calculateX(index - (this.offsetGridLines ? 0.5 : 0)) + aliasPixel(this.lineWidth),
                        isRotated = (this.xLabelRotation > 0);

                    ctx.beginPath();

                    if (index > 0) {
                        // This is a grid line in the centre, so drop that
                        ctx.lineWidth = this.gridLineWidth;
                        ctx.strokeStyle = this.gridLineColor;
                    } else {
                        // This is the first line on the scale
                        ctx.lineWidth = this.lineWidth;
                        ctx.strokeStyle = this.lineColor;
                    }
                    ctx.moveTo(linePos, this.endPoint);
                    ctx.lineTo(linePos, this.startPoint - 3);
                    ctx.stroke();
                    ctx.closePath();

                    ctx.lineWidth = this.lineWidth;
                    ctx.strokeStyle = this.lineColor;

                    // Small lines at the bottom of the base grid line
                    ctx.beginPath();
                    ctx.moveTo(linePos, this.endPoint);
                    ctx.lineTo(linePos, this.endPoint + 5);
                    ctx.stroke();
                    ctx.closePath();

                    ctx.save();
                    ctx.translate(xPos, (isRotated) ? this.endPoint + 12 : this.endPoint + 8);
                    ctx.rotate(toRadians(this.xLabelRotation) * -1);
                    ctx.font = this.font;
                    ctx.textAlign = (isRotated) ? "right" : "center";
                    ctx.textBaseline = (isRotated) ? "middle" : "top";
                    ctx.fillText(label, 0, 0);
                    ctx.restore();
                }, this);
            }
        }
    });

    Chart.RadialScale = Chart.Element.extend({
        initialize: function () {
            this.size = min([this.height, this.width]);
            this.drawingArea = (this.display) ? (this.size / 2) - (this.fontSize / 2 + this.backdropPaddingY) : (this.size / 2);
        },
        calculateCenterOffset: function (value) {
            // Take into account half font size + the yPadding of the top value
            var scalingFactor = this.drawingArea / (this.max - this.min);

            return (value - this.min) * scalingFactor;
        },
        update: function () {
            if (!this.lineArc) {
                this.setScaleSize();
            } else {
                this.drawingArea = (this.display) ? (this.size / 2) - (this.fontSize / 2 + this.backdropPaddingY) : (this.size / 2);
            }
            this.buildYLabels();
        },
        buildYLabels: function () {
            this.yLabels = [];

            var stepDecimalPlaces = getDecimalPlaces(this.stepValue);

            for (var i = 0; i <= this.steps; i++) {
                this.yLabels.push(template(this.templateString, { value: (this.min + (i * this.stepValue)).toFixed(stepDecimalPlaces) }));
            }
        },
        getCircumference: function () {
            return ((Math.PI * 2) / this.valuesCount);
        },
        setScaleSize: function () {
			/*
			 * Right, this is really confusing and there is a lot of maths going on here
			 * The gist of the problem is here: https://gist.github.com/nnnick/696cc9c55f4b0beb8fe9
			 *
			 * Reaction: https://dl.dropboxusercontent.com/u/34601363/toomuchscience.gif
			 *
			 * Solution:
			 *
			 * We assume the radius of the polygon is half the size of the canvas at first
			 * at each index we check if the text overlaps.
			 *
			 * Where it does, we store that angle and that index.
			 *
			 * After finding the largest index and angle we calculate how much we need to remove
			 * from the shape radius to move the point inwards by that x.
			 *
			 * We average the left and right distances to get the maximum shape radius that can fit in the box
			 * along with labels.
			 *
			 * Once we have that, we can find the centre point for the chart, by taking the x text protrusion
			 * on each side, removing that from the size, halving it and adding the left x protrusion width.
			 *
			 * This will mean we have a shape fitted to the canvas, as large as it can be with the labels
			 * and position it in the most space efficient manner
			 *
			 * https://dl.dropboxusercontent.com/u/34601363/yeahscience.gif
			 */

            // Get maximum radius of the polygon. Either half the height (minus the text width) or half the width.
            // Use this to calculate the offset + change. - Make sure L/R protrusion is at least 0 to stop issues with centre points
            var largestPossibleRadius = min([(this.height / 2 - this.pointLabelFontSize - 5), this.width / 2]),
                pointPosition,
                i,
                textWidth,
                halfTextWidth,
                furthestRight = this.width,
                furthestRightIndex,
                furthestRightAngle,
                furthestLeft = 0,
                furthestLeftIndex,
                furthestLeftAngle,
                xProtrusionLeft,
                xProtrusionRight,
                radiusReductionRight,
                radiusReductionLeft,
                maxWidthRadius;
            this.ctx.font = fontString(this.pointLabelFontSize, this.pointLabelFontStyle, this.pointLabelFontFamily);
            for (i = 0; i < this.valuesCount; i++) {
                // 5px to space the text slightly out - similar to what we do in the draw function.
                pointPosition = this.getPointPosition(i, largestPossibleRadius);
                textWidth = this.ctx.measureText(template(this.templateString, { value: this.labels[i] })).width + 5;
                if (i === 0 || i === this.valuesCount / 2) {
                    // If we're at index zero, or exactly the middle, we're at exactly the top/bottom
                    // of the radar chart, so text will be aligned centrally, so we'll half it and compare
                    // w/left and right text sizes
                    halfTextWidth = textWidth / 2;
                    if (pointPosition.x + halfTextWidth > furthestRight) {
                        furthestRight = pointPosition.x + halfTextWidth;
                        furthestRightIndex = i;
                    }
                    if (pointPosition.x - halfTextWidth < furthestLeft) {
                        furthestLeft = pointPosition.x - halfTextWidth;
                        furthestLeftIndex = i;
                    }
                }
                else if (i < this.valuesCount / 2) {
                    // Less than half the values means we'll left align the text
                    if (pointPosition.x + textWidth > furthestRight) {
                        furthestRight = pointPosition.x + textWidth;
                        furthestRightIndex = i;
                    }
                }
                else if (i > this.valuesCount / 2) {
                    // More than half the values means we'll right align the text
                    if (pointPosition.x - textWidth < furthestLeft) {
                        furthestLeft = pointPosition.x - textWidth;
                        furthestLeftIndex = i;
                    }
                }
            }

            xProtrusionLeft = furthestLeft;

            xProtrusionRight = Math.ceil(furthestRight - this.width);

            furthestRightAngle = this.getIndexAngle(furthestRightIndex);

            furthestLeftAngle = this.getIndexAngle(furthestLeftIndex);

            radiusReductionRight = xProtrusionRight / Math.sin(furthestRightAngle + Math.PI / 2);

            radiusReductionLeft = xProtrusionLeft / Math.sin(furthestLeftAngle + Math.PI / 2);

            // Ensure we actually need to reduce the size of the chart
            radiusReductionRight = (isNumber(radiusReductionRight)) ? radiusReductionRight : 0;
            radiusReductionLeft = (isNumber(radiusReductionLeft)) ? radiusReductionLeft : 0;

            this.drawingArea = largestPossibleRadius - (radiusReductionLeft + radiusReductionRight) / 2;

            //this.drawingArea = min([maxWidthRadius, (this.height - (2 * (this.pointLabelFontSize + 5)))/2])
            this.setCenterPoint(radiusReductionLeft, radiusReductionRight);
        },
        setCenterPoint: function (leftMovement, rightMovement) {
            var maxRight = this.width - rightMovement - this.drawingArea,
                maxLeft = leftMovement + this.drawingArea;

            this.xCenter = (maxLeft + maxRight) / 2;
            // Always vertically in the centre as the text height doesn't change
            this.yCenter = (this.height / 2);
        },

        getIndexAngle: function (index) {
            var angleMultiplier = (Math.PI * 2) / this.valuesCount;
            // Start from the top instead of right, so remove a quarter of the circle

            return index * angleMultiplier - (Math.PI / 2);
        },
        getPointPosition: function (index, distanceFromCenter) {
            var thisAngle = this.getIndexAngle(index);
            return {
                x: (Math.cos(thisAngle) * distanceFromCenter) + this.xCenter,
                y: (Math.sin(thisAngle) * distanceFromCenter) + this.yCenter
            };
        },
        draw: function () {
            if (this.display) {
                var ctx = this.ctx;
                each(this.yLabels, function (label, index) {
                    // Don't draw a centre value
                    if (index > 0) {
                        var yCenterOffset = index * (this.drawingArea / this.steps),
                            yHeight = this.yCenter - yCenterOffset,
                            pointPosition;

                        // Draw circular lines around the scale
                        if (this.lineWidth > 0) {
                            ctx.strokeStyle = this.lineColor;
                            ctx.lineWidth = this.lineWidth;

                            if (this.lineArc) {
                                ctx.beginPath();
                                ctx.arc(this.xCenter, this.yCenter, yCenterOffset, 0, Math.PI * 2);
                                ctx.closePath();
                                ctx.stroke();
                            } else {
                                ctx.beginPath();
                                for (var i = 0; i < this.valuesCount; i++) {
                                    pointPosition = this.getPointPosition(i, this.calculateCenterOffset(this.min + (index * this.stepValue)));
                                    if (i === 0) {
                                        ctx.moveTo(pointPosition.x, pointPosition.y);
                                    } else {
                                        ctx.lineTo(pointPosition.x, pointPosition.y);
                                    }
                                }
                                ctx.closePath();
                                ctx.stroke();
                            }
                        }
                        if (this.showLabels) {
                            ctx.font = fontString(this.fontSize, this.fontStyle, this.fontFamily);
                            if (this.showLabelBackdrop) {
                                var labelWidth = ctx.measureText(label).width;
                                ctx.fillStyle = this.backdropColor;
                                ctx.fillRect(
                                    this.xCenter - labelWidth / 2 - this.backdropPaddingX,
                                    yHeight - this.fontSize / 2 - this.backdropPaddingY,
                                    labelWidth + this.backdropPaddingX * 2,
                                    this.fontSize + this.backdropPaddingY * 2
                                );
                            }
                            ctx.textAlign = 'center';
                            ctx.textBaseline = "middle";
                            ctx.fillStyle = this.fontColor;
                            ctx.fillText(label, this.xCenter, yHeight);
                        }
                    }
                }, this);

                if (!this.lineArc) {
                    ctx.lineWidth = this.angleLineWidth;
                    ctx.strokeStyle = this.angleLineColor;
                    for (var i = this.valuesCount - 1; i >= 0; i--) {
                        if (this.angleLineWidth > 0) {
                            var outerPosition = this.getPointPosition(i, this.calculateCenterOffset(this.max));
                            ctx.beginPath();
                            ctx.moveTo(this.xCenter, this.yCenter);
                            ctx.lineTo(outerPosition.x, outerPosition.y);
                            ctx.stroke();
                            ctx.closePath();
                        }
                        // Extra 3px out for some label spacing
                        var pointLabelPosition = this.getPointPosition(i, this.calculateCenterOffset(this.max) + 5);
                        ctx.font = fontString(this.pointLabelFontSize, this.pointLabelFontStyle, this.pointLabelFontFamily);
                        ctx.fillStyle = this.pointLabelFontColor;

                        var labelsCount = this.labels.length,
                            halfLabelsCount = this.labels.length / 2,
                            quarterLabelsCount = halfLabelsCount / 2,
                            upperHalf = (i < quarterLabelsCount || i > labelsCount - quarterLabelsCount),
                            exactQuarter = (i === quarterLabelsCount || i === labelsCount - quarterLabelsCount);
                        if (i === 0) {
                            ctx.textAlign = 'center';
                        } else if (i === halfLabelsCount) {
                            ctx.textAlign = 'center';
                        } else if (i < halfLabelsCount) {
                            ctx.textAlign = 'left';
                        } else {
                            ctx.textAlign = 'right';
                        }

                        // Set the correct text baseline based on outer positioning
                        if (exactQuarter) {
                            ctx.textBaseline = 'middle';
                        } else if (upperHalf) {
                            ctx.textBaseline = 'bottom';
                        } else {
                            ctx.textBaseline = 'top';
                        }

                        ctx.fillText(this.labels[i], pointLabelPosition.x, pointLabelPosition.y);
                    }
                }
            }
        }
    });

    // Attach global event to resize each chart instance when the browser resizes
    helpers.addEvent(window, "resize", (function () {
        // Basic debounce of resize function so it doesn't hurt performance when resizing browser.
        var timeout;
        return function () {
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                each(Chart.instances, function (instance) {
                    // If the responsive flag is set in the chart instance config
                    // Cascade the resize event down to the chart.
                    if (instance.options.responsive) {
                        instance.resize(instance.render, true);
                    }
                });
            }, 50);
        };
    })());

    if (amd) {
        define(function () {
            return Chart;
        });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = Chart;
    }

    root.Chart = Chart;

    Chart.noConflict = function () {
        root.Chart = previous;
        return Chart;
    };
}).call(this);