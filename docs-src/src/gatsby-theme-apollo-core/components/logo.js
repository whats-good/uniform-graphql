import React from 'react';
import styled from '@emotion/styled';
import { ReactComponent as ReactLogo } from '../../../static/logo.svg';

const Wrapper = styled.div({
  display: 'flex',
  fontSize: 24,
});

export default function Logo() {
  return (
    <Wrapper>
      <ReactLogo style={{ width: '100%' }} />
    </Wrapper>
  );
}
