import React from 'react';
// TODO: delete this file when algolia is setup.

// TODO: fix apollo icon on mobile nav

import PropTypes from 'prop-types';
import styled from '@emotion/styled';

const sizes = {
  sm: 600,
  md: 850,
  lg: 1120,
};

const breakpoints = Object.keys(sizes).reduce(
  (acc, key) => ({
    ...acc,
    [key]: `@media (max-width: ${sizes[key]}px)`,
  }),
  {},
);

const Wrapper = styled.header({
  position: 'sticky',
  top: 0,
  left: 0,
  zIndex: 1,
});

const InnerWrapper = styled.div({
  display: 'flex',
  alignItems: 'center',
  padding: '0 56px',
  backgroundColor: 'white',
  [breakpoints.md]: {
    padding: '0 24px',
  },
});

export default function Header(props) {
  return (
    <Wrapper>
      {props.beforeContent}
      <InnerWrapper>{props.children}</InnerWrapper>
    </Wrapper>
  );
}

Header.propTypes = {
  beforeContent: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
};
