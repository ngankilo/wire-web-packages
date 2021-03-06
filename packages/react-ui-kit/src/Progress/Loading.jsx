/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import {ANIMATION, DURATION} from '../Identity/motions';
import styled, {css, keyframes} from 'styled-components';
import PropTypes from 'prop-types';
import React from 'react';

const pathLength = 125.68;

function LoadingComponent({className, progress}) {
  const additionalProps = {};
  if (progress !== null) {
    additionalProps.strokeDashoffset = `${pathLength - pathLength * progress}`;
  }
  return (
    <svg className={className} width="43" height="43" viewBox="0 0 43 43" strokeWidth="3" fill="none">
      <circle cx="21.5" cy="21.5" r="20" stroke="rgba(51,55,58,.08)" />
      <circle
        cx="21.5"
        cy="21.5"
        r="20"
        stroke="#218fd1"
        strokeLinecap="round"
        transform="rotate(-90 21.5 21.5)"
        strokeDasharray={pathLength}
        {...additionalProps}
      />
    </svg>
  );
}
LoadingComponent.propTypes = {
  className: PropTypes.string.isRequired,
  progress: PropTypes.number,
};
LoadingComponent.defaultProps = {
  progress: null,
};

const fillAnimation = keyframes`
  0% {
    stroke-dashoffset: ${pathLength + pathLength};
  }
  100% {
    stroke-dashoffset: 0;
  }
`;

const Loading = styled(LoadingComponent)`
  ${props =>
    props.progress === null &&
    css`
      circle:nth-of-type(2) {
        stroke-dasharray: ${pathLength};
      }
      animation: ${fillAnimation} ${DURATION.EXTRA_LONG} infinite ease-in-out,
        ${ANIMATION.rotate} ${DURATION.EXTRA_LONG} infinite linear;
    `};
`;

Loading.propTypes = {
  progress: PropTypes.number,
};

Loading.defaultProps = {
  progress: null,
};

export {Loading};
