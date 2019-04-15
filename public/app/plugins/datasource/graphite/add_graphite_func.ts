import _ from 'lodash';
import $ from 'jquery';
import rst2html from 'rst2html';
import Drop from 'tether-drop';
import coreModule from 'app/core/core_module';

/** @ngInject */
export function graphiteAddFunc($compile) {
  const inputTemplate =
    '<input type="text"' + ' class="gf-form-input"' + ' spellcheck="false" style="display:none"></input>';

  const buttonTemplate =
    '<a class="gf-form-label query-part dropdown-toggle"' +
    ' tabindex="1" gf-dropdown="functionMenu" data-toggle="dropdown">' +
    '<i class="fa fa-plus"></i></a>';

  return {
    link: function($scope, elem) {
      const ctrl = $scope.ctrl;

      const $input = $(inputTemplate);
      const $button = $(buttonTemplate);

      $input.appendTo(elem);
      $button.appendTo(elem);

      ctrl.datasource.getFuncDefs().then(funcDefs => {
        const allFunctions = _.map(funcDefs, 'name').sort();

        $scope.functionMenu = createFunctionDropDownMenu(funcDefs);

        $input.attr('data-provide', 'typeahead');
        $input.typeahead({
          source: allFunctions,
          minLength: 1,
          items: 10,
          updater: value => {
            let funcDef: any = ctrl.datasource.getFuncDef(value);
            if (!funcDef) {
              // try find close match
              value = value.toLowerCase();
              funcDef = _.find(allFunctions, funcName => {
                return funcName.toLowerCase().indexOf(value) === 0;
              });

              if (!funcDef) {
                return '';
              }
            }

            $scope.$apply(() => {
              ctrl.addFunction(funcDef);
            });

            $input.trigger('blur');
            return '';
          },
        });

        $button.click(() => {
          $button.hide();
          $input.show();
          $input.focus();
        });

        $input.keyup(() => {
          elem.toggleClass('open', $input.val() === '');
        });

        $input.blur(() => {
          // clicking the function dropdown menu won't
          // work if you remove class at once
          setTimeout(() => {
            $input.val('');
            $input.hide();
            $button.show();
            elem.removeClass('open');
          }, 200);
        });

        $compile(elem.contents())($scope);
      });

      let drop;
      const cleanUpDrop = () => {
        if (drop) {
          drop.destroy();
          drop = null;
        }
      };

      $(elem)
        .on('mouseenter', 'ul.dropdown-menu li', () => {
          cleanUpDrop();

          let funcDef;
          try {
            funcDef = ctrl.datasource.getFuncDef($('a', this).text());
          } catch (e) {
            // ignore
          }

          if (funcDef && funcDef.description) {
            let shortDesc = funcDef.description;
            if (shortDesc.length > 500) {
              shortDesc = shortDesc.substring(0, 497) + '...';
            }

            const contentElement = document.createElement('div');
            contentElement.innerHTML = '<h4>' + funcDef.name + '</h4>' + rst2html(shortDesc);

            drop = new Drop({
              target: this,
              content: contentElement,
              classes: 'drop-popover',
              openOn: 'always',
              tetherOptions: {
                attachment: 'bottom left',
                targetAttachment: 'bottom right',
              },
            });
          }
        })
        .on('mouseout', 'ul.dropdown-menu li', () => {
          cleanUpDrop();
        });

      $scope.$on('$destroy', cleanUpDrop);
    },
  };
}

coreModule.directive('graphiteAddFunc', graphiteAddFunc);

function createFunctionDropDownMenu(funcDefs) {
  const categories = {};

  _.forEach(funcDefs, funcDef => {
    if (!funcDef.category) {
      return;
    }
    if (!categories[funcDef.category]) {
      categories[funcDef.category] = [];
    }
    categories[funcDef.category].push({
      text: funcDef.name,
      click: "ctrl.addFunction('" + funcDef.name + "')",
    });
  });

  return _.sortBy(
    _.map(categories, (submenu, category) => {
      return {
        text: category,
        submenu: _.sortBy(submenu, 'text'),
      };
    }),
    'text'
  );
}
