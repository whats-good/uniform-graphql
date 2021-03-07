import React from 'react';
import styled from '@emotion/styled';
import { ApolloIcon } from '@apollo/space-kit/icons/ApolloIcon';

const Wrapper = styled.div({
  display: 'flex',
  fontSize: 24,
});

export default function Logo() {
  return (
    <Wrapper>
      {/* <StyledApolloIcon /> */}
      <img
        style={{
          width: '100%',
        }}
        src="/logo.svg"
      />
    </Wrapper>
  );
}
