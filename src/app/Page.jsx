import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Container, TextField, Button, Typography, Alert, AlertTitle } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const Page = () => {
  const [tableNumber, setTableNumber] = useState('');
  const [error, setError] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [alertTitle, setAlertTitle] = useState('info');
  const [showAlert, setShowAlert] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setTableNumber(value);
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!error && tableNumber !== '') {
      setIsButtonDisabled(true);
      setCountdown(3);
  
      try {
        const response = await axios.post('http://localhost:1323/api/v1/restaurant/table', {
          tableId: parseInt(tableNumber)
        });
        console.log(response.data)
        if (response.status === 200) {
          setAlertMessage('Table found successfully.');
          setAlertSeverity('success');
          setAlertTitle('Success');
          setShowAlert(true);
  
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
  
          setTimeout(() => {
            navigate('/get/menu', { state: { tableNumber } });
          }, 3000);
  
          return () => clearInterval(timer); //clear timer
        }
      } catch (error) {
        console.log(error.response.data)
        if (error.response) {
          // มีการตอบกลับจาก backend แต่เกิดข้อผิดพลาด
          setAlertMessage(error.response.data.message || 'Error occurred.');
        } else if (error.code === 'ERR_NETWORK') {
          // ไม่สามารถเชื่อมต่อกับ backend ได้ (เช่น ไม่ได้เปิด server)
          setAlertMessage('Cannot connect to server. Please make sure server is running.');
        } else {
          // ข้อผิดพลาดอื่น ๆ ที่ไม่ใช่การเชื่อมต่อ
          setAlertMessage('An unexpected error occurred.');
        }
        setAlertSeverity('error');
        setAlertTitle('Error');
        setShowAlert(true);
        setIsButtonDisabled(false);
        setCountdown(0);
      }
    } else {
      setAlertMessage('Please enter a valid table number.');
      setAlertSeverity('warning');
      setAlertTitle('Warning');
      setShowAlert(true);
    }
  };
  

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 3000);

      return () => clearTimeout(timer); // clear timer
    }
  }, [showAlert]);

  return (
    <Container>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '300px',
            padding: 3,
            boxShadow: 3,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" align="center">
            Enter Table Number
          </Typography>
          <TextField
            label="Table Number"
            variant="outlined"
            value={tableNumber}
            onChange={handleChange}
            error={error}
            helperText={error ? 'Please enter numbers only' : ''}
          />
          <Button type="submit" variant="contained" color="primary" disabled={isButtonDisabled}>
            {isButtonDisabled && countdown > 0 ? `Please wait... (${countdown})` : 'Submit'}
          </Button>
        </Box>
      </Box>

      {/* Alert */}
      {showAlert && (
        <Alert
          variant="outlined"
          severity={alertSeverity}
          onClose={handleCloseAlert}
          sx={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', width: '300px' }}
        >
          <AlertTitle>{alertTitle}</AlertTitle>
          {alertMessage}
        </Alert>
      )}
    </Container>
  );
};
