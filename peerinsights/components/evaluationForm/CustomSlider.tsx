'use client';
import { Slider } from '@mui/material';
import { styled } from '@mui/material/styles';

const CustomSlider = styled(Slider)({
  color: '#861f41',
  height: 6,
  '& .MuiSlider-thumb': {
    height: 20,
    width: 20,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
  },
  '& .MuiSlider-track': {
    border: 'none',
  },
  '& .MuiSlider-rail': {
    opacity: 0.3,
    backgroundColor: '#bfbfbf',
  },
});

export default CustomSlider;
