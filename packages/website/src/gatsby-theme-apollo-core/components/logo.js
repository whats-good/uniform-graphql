import React from 'react';
import styled from '@emotion/styled';

const Wrapper = styled.div({
  display: 'flex',
  fontSize: 24,
});

export default function Logo() {
  return (
    <Wrapper>
      <img
        style={{
          width: '100%',
        }}
        src="/logo.svg"
      />
    </Wrapper>
  );
}
