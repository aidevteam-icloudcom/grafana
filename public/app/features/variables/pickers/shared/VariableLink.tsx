import React, { PureComponent } from 'react';
import { getTagColorsFromName, Icon } from '@grafana/ui';
import { e2e } from '@grafana/e2e';
import { VariableTag } from '../../../templating/types';

interface Props {
  onClick: () => void;
  text: string;
  tags: VariableTag[];
}
export class VariableLink extends PureComponent<Props> {
  onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    event.preventDefault();
    this.props.onClick();
  };

  render() {
    const { tags = [], text } = this.props;

    return (
      <a
        onClick={this.onClick}
        className="variable-value-link"
        aria-label={e2e.pages.Dashboard.SubMenu.selectors.submenuItemValueDropDownValueLinkTexts(`${text}`)}
      >
        {text}
        {tags.map(tag => {
          const { color, borderColor } = getTagColorsFromName(tag.text.toString());
          return (
            <span bs-tooltip="tag.valuesText" data-placement="bottom" key={`${tag.text}`}>
              <span className="label-tag" style={{ backgroundColor: color, borderColor }}>
                &nbsp;&nbsp;
                <Icon name="tag-alt" />
                &nbsp; {tag.text}
              </span>
            </span>
          );
        })}
        <Icon name="angle-down" size="sm" />
      </a>
    );
  }
}
