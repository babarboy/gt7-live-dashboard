// Overlay.js
import { Box } from '@mui/material';

interface OverlayProps {
    isFlashing: boolean;
  }  

const Overlay: React.FC<OverlayProps> = ({ isFlashing }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: isFlashing ? 'orange' : '#ddd',
        transition: 'background-color 100ms ease-in-out',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
}

export default Overlay;