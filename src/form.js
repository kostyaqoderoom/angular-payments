"use strict";

angular.module('angularPayments')
    .directive('stripeForm', ['$window', '$parse', 'Common', function ($window, $parse, Common) {
        
        // directive intercepts form-submission, obtains Stripe's cardToken using stripe.js
        // and then passes that to callback provided in stripeForm, attribute.
        
        // data that is sent to stripe is filtered from scope, looking for valid values to
        // send and converting camelCase to snake_case, e.g expMonth -> exp_month
        
        
        // filter valid stripe-values from scope and convert them from camelCase to snake_case
        var _getDataToSend = function (data) {
            
            var possibleKeys = ['card', 'number', 'expMonth', 'expYear', 'expiry',
                'cvc', 'name', 'addressLine1',
                'addressLine2', 'addressCity',
                'addressState', 'addressZip',
                'addressCountry'];
            
            var camelToSnake = function (str) {
                return str.replace(/([A-Z])/g, function (m) {
                    return '_' + m.toLowerCase();
                });
            };
            
            var ret = {};
            
            for (var i in possibleKeys) {
                
                if (possibleKeys.hasOwnProperty(i) && data.hasOwnProperty(possibleKeys[i])) {
                    
                    if (data[possibleKeys[i]]) {
                        if (possibleKeys[i] === 'expiry') {
                            var exp = Common.parseExpiry(data[possibleKeys[i]].$modelValue);
                            ret[camelToSnake('expMonth')] = exp.month;
                            ret[camelToSnake('expYear')] = exp.year;
                        }
                        else {
                            ret[camelToSnake(possibleKeys[i])] = angular.copy(data[possibleKeys[i]].$modelValue);
                        }
                    }
                }
            }
            
            ret.number = (ret.number || ret.card || '').replace(/ /g, '');
            
            return ret;
        };
        
        return {
            restrict: 'A',
            link: function (scope, elem, attr) {
                
                if (!$window.Stripe) {
                    throw 'stripeForm requires that you have stripe.js installed. Include https://js.stripe.com/v2/ into your html.';
                }
                
                var form = angular.element(elem);
                
                form.bind('submit', function () {
    
                    var button = form.find('button');
                    button.prop('disabled', true);
    
                    if (form.hasClass('ng-valid')) {
        
                        $window.Stripe.createToken(_getDataToSend(scope[attr.name]), function () {
                            var args = arguments;
                            scope.$apply(function () {
                                scope[attr.stripeForm].apply(scope, args);
                            });
                            button.prop('disabled', false);
                        });
        
                    } else {
        
                        scope.$apply(function () {
                            scope[attr.stripeForm].apply(scope, [400, {error: 'Invalid form submitted.'}]);
                        });
                        button.prop('disabled', false);
                    }
    
                    scope.expMonth = null;
                    scope.expYear = null;
                });
            }
        };
    }]);
