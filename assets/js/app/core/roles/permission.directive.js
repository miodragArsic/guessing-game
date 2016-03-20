(function() {
    'use strict';

    angular
        .module('app')
        .directive('permission', permission);

    permission.$inject = ['$animate', 'utils', 'roles.manager'];

    function permission($animate, utils, roleManager) {
        var directive = {
            restrict: 'A',
            multiElement: true,
            priority: 599,
            terminal: true,
            transclude: 'element',
            link: linker,
            $$tlb: true
        };
        return directive;

        function linker($scope, $element, $attr, ctrl, $transclude) {

            var block;
            var childScope;
            var previousElements;

            var permission = parsePermissionRef($attr.permission);

            if (permission.payloadExpr) {
                $scope.$watch(permission.payloadExpr, function(val) {
                    if (val !== permission.payload) {
                        update(val);
                    }
                }, true);

                permission.payload = angular.copy($scope.$eval(permission.payloadExpr));
            } else {

                permission.payload = {};
            }

            utils.$rootScope.$on('user.login', function() {
                update(permission.payload);
            });

            utils.$rootScope.$on('user.logout', function() {
                update(permission.payload);
            });

            update(permission.payload);

            function parsePermissionRef(ref) {

                var parsed = ref.replace(/\n/g, ' ').match(/^([^(]+?)\s*(\((.*)\))?$/);
                if (!parsed || parsed.length !== 4) {
                    throw new Error('Invalid permission ref "' + ref + '"');
                }

                return {
                    name: parsed[1],
                    payloadExpr: parsed[3] || null
                };
            }

            function update(newPermissionPayload) {

                if (newPermissionPayload) {
                    permission.payload = angular.copy(newPermissionPayload);
                }

                var authorized = roleManager.authorize(permission.name, permission.payload);

                //run ngIf to remove elements and child scopes if not authorized or to add elements
                runNgIf(authorized);
            }

            //Code entirely taken from angular ngIf directive
            function runNgIf(value) {
                if (value) {
                    if (!childScope) {
                        $transclude(function(clone, newScope) {
                            childScope = newScope;
                            clone[clone.length++] = document.createComment(' end permission: ' + $attr.permission + ' ');

                            // Note: We only need the first/last node of the cloned nodes.
                            // However, we need to keep the reference to the jqlite wrapper as it might be changed later
                            // by a directive with templateUrl when its template arrives.
                            block = {
                                clone: clone
                            };
                            $animate.enter(clone, $element.parent(), $element);
                        });
                    }
                } else {
                    if (previousElements) {
                        previousElements.remove();
                        previousElements = null;
                    }

                    if (childScope) {
                        childScope.$destroy();
                        childScope = null;
                    }

                    if (block) {
                        previousElements = getBlockNodes(block.clone);
                        $animate.leave(previousElements).then(function() {
                            previousElements = null;
                        });

                        block = null;
                    }
                }
            }

            //Code entirely take from angular core, as ngIf was using it internally
            function getBlockNodes(nodes) {
                // TODO(perf): update `nodes` instead of creating a new object?
                var node = nodes[0];
                var endNode = nodes[nodes.length - 1];
                var blockNodes;

                for (var i = 1; node !== endNode && (node = node.nextSibling); i++) {
                    if (blockNodes || nodes[i] !== node) {
                        if (!blockNodes) {
                            blockNodes = jqLite(slice.call(nodes, 0, i));
                        }

                        blockNodes.push(node);
                    }
                }

                return blockNodes || nodes;
            }
        }
    }

})();
