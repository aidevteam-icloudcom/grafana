import React, { FC } from 'react';

export interface Props {
  isReadOnly: boolean;
  datasourcesPageHref?: string;
  onDelete: () => void;
  onSubmit: (event) => void;
  onTest: (event) => void;
}

const ButtonRow: FC<Props> = ({ isReadOnly, onDelete, onSubmit, datasourcesPageHref, onTest }) => {
  return (
    <div className="gf-form-button-row">
      {!isReadOnly && (
        <button type="submit" className="btn btn-primary" disabled={isReadOnly} onClick={event => onSubmit(event)}>
          Save &amp; Test
        </button>
      )}
      {isReadOnly && (
        <button type="submit" className="btn btn-success" onClick={onTest}>
          Test
        </button>
      )}
      <button type="submit" className="btn btn-danger" disabled={isReadOnly} onClick={onDelete}>
        Delete
      </button>
      <a className="btn btn-inverse" href={datasourcesPageHref}>
        Back
      </a>
    </div>
  );
};

export default ButtonRow;
