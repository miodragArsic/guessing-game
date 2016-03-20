(function(ng) {
    ng
        .module('app')
        .factory('api.rulesService', RulesService);

    RulesService.$inject = [
        '$http',
        'api.url'
    ];

    function RulesService($http, apiUrl) {

        var service = {
            getAll: getAll,
            get: get,
            getHistory: getHistory,
            create: create,
            update: update,
            delete: deleteRule,
            enabled: enabled,
            hasIssue: hasIssue,
            getDeviceRulesCount: getDeviceRulesCount,
            getDeviceRules: getDeviceRules,
            subscribeOnRuleNotifications: subscribe,
            unsubscribeFromRuleNotifications: unsubscribe
        };

        return service;

        ///////////////////////////////////////////

        function getAll() {

            var url = apiUrl + 'rules';
            return $http.get(url);
        }

        function get(ruleId) {

            var url = apiUrl + 'rules/' + ruleId;
            return $http.get(url);
        }

        function getHistory(ruleId) {

            var url = '{0}rules/{1}/history'.format(apiUrl, ruleId);
            return $http.get(url);
        }

        function create(name, description, definition) {

            var url = apiUrl + 'rules';
            var data = {
                Name: name,
                Description: description,
                Definition: definition
            };

            return $http.post(url, data);
        }

        function update(id, name, description, definition) {
            var url = apiUrl + 'rules/' + id;

            var data = {};

            if (name) {
                data.Name = name;
            }

            if (description) {
                data.Description = description;
            }

            if (definition) {
                data.Definition = definition;
            }

            return $http.put(url, data);
        }

        function deleteRule(id) {
            var url = apiUrl + 'rules/' + id;

            return $http.delete(url);
        }

        function enabled(id, value) {
            var url = apiUrl + 'rules/enabled/' + id + '?value=' + value;

            return $http.post(url);
        }

        function hasIssue(rule) {

            //undefined, compliation error, missing assets
            if (rule.status === 0 || rule.status === 3 || rule.status === 4) {
                return true;
            }

            return false;
        }

        function getDeviceRules(deviceID, pageSize, page) {

            var url = apiUrl + 'device/' + deviceID + '/rules';

            url = url + getQuery(pageSize, page);

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function getDeviceRulesCount(deviceID) {

            var url = apiUrl + 'device/' + deviceID + '/rules/meta';

            return $http.get(url);
        }

        function subscribe(ruleId) {
            var url = apiUrl + 'device/notifications/' + ruleId + '/subscription';

            return $http.put(url);
        }

        function unsubscribe(ruleId) {
            var url = apiUrl + 'device/notifications/' + ruleId + '/subscription';

            return $http.delete(url);
        }

        function getQuery(count, page) {
            if (!page && !count) {
                return '';
            }

            var query = '?';
            var items = [];

            if (count) {
                items.push('perPage=' + count);
            }

            if (page) {
                items.push('page=' + page);
            }

            query = query + items.join('&');

            return query;
        }
    }
}(window.angular));
