import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [brakeData, setBrakeData] = useState(0);
  const [throttleData, setThrottleData] = useState(0);
  const [isRevLimiterFlashing, setIsRevLimiterFlashing] = useState(0);
  const [tireTemps, setTireTemps] = useState({
    FL: 0,
    FR: 0,
    RL: 0,
    RR: 0,
  });
  const [ps5Ip, setPs5Ip] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(true); // To control modal visibility
  const theme = useTheme();
  const hostname = window.location.hostname;

  useEffect(() => {
    if (!isModalOpen) {
      const ws = new WebSocket(`ws://${hostname}:8080/ws`);
      ws.onmessage = (event) => {
        const { Brake, Throttle, TyreTempFL, TyreTempFR, TyreTempRL, TyreTempRR, IsRevLimiterFlashing } = JSON.parse(event.data);
        setBrakeData(Brake);
        setThrottleData(Throttle);
        setTireTemps({
          FL: TyreTempFL,
          FR: TyreTempFR,
          RL: TyreTempRL,
          RR: TyreTempRR,
        });
        setIsRevLimiterFlashing(IsRevLimiterFlashing);
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      return () => {
        ws.close();
      };
    }
  }, [isModalOpen]);

  const getTempColor = (temp: number) => {
    if (temp >= 100) return theme.palette.error.main;
    if (temp >= 85) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  // Function to handle the POST request when the "Go" button is clicked
  const handleConfigure = () => {
    fetch(`http://${hostname}:8080/configure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ps5_ip: ps5Ip }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Configuration success:', data);
        setIsModalOpen(false); // Close the modal after successful configuration
      })
      .catch((error) => {
        console.error('Error configuring PS5 IP:', error);
      });
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', bgcolor: '#111', position: 'relative' }}>
      {/* Brake Section */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, width: '50%', height: '100%', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography variant="h1" sx={{ color: '#fff', zIndex: 1 }}>
            {Math.round(brakeData)}%
          </Typography>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: `${brakeData}%`,
              backgroundColor: theme.palette.error.light,
              transition: 'height 1ms linear',
              animation: brakeData === 100 ? 'flash 150ms infinite' : 'none',
            }}
          />
        </Box>
      </Box>

      {/* Throttle Section */}
      <Box sx={{ position: 'fixed', top: 0, left: '50%', width: '50%', height: '100%', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography variant="h1" sx={{ color: '#fff', zIndex: 1 }}>
            {Math.round(throttleData)}%
          </Typography>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: `${throttleData}%`,
              backgroundColor: theme.palette.success.light,
              transition: 'height 1ms linear',
              animation: isRevLimiterFlashing ? 'flash 150ms infinite' : 'none',
            }}
          />
        </Box>
      </Box>

      {/* Tire Temperature Section */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: '20%',
          height: '40%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          bgcolor: '#222',
          p: 1,
          borderRadius: 2,
        }}
      >
        {Object.entries(tireTemps).map(([position, temp]) => (
          <Box
            key={position}
            sx={{
              bgcolor: getTempColor(temp),
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 1,
              height: '100%',
            }}
          >
            <Typography variant="body1" sx={{ color: '#fff', textAlign: 'center' }}>
              {position}
              <br />
              {Math.round(temp)}°C
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Modal for IP Input */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogTitle>Enter PS5 IP</DialogTitle>
        <DialogContent>
          <TextField
            label="PS5 IP"
            variant="outlined"
            size="small"
            value={ps5Ip}
            onChange={(e) => setPs5Ip(e.target.value)}
            sx={{ mt: 2, width: '300px', backgroundColor: 'white' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfigure} variant="contained" color="primary">
            Go
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;