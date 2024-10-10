import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, Alert, AlertTitle,
    Container, Box, CircularProgress, List, ListItem, ListItemText, Card, CardMedia, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import axios from 'axios';  // ใช้ Axios

export const OrderSummary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [error, setError] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('info');
    const [alertTitle, setAlertTitle] = useState('info');
    const [showAlert, setShowAlert] = useState(false);
    const [orderData, setOrderData] = useState(location.state?.orderData || {});

    useEffect(() => {
        // Check table id
        if (!location.state || !location.state.orderData || !location.state.orderData.tableId) {
            console.log("Please enter table id!");
            setOpenDialog(true);
        } else {
            // Simulate loading process
            const timer = setTimeout(() => {
                setLoading(false);
            }, 2000); // 2 seconds loading time

            return () => clearTimeout(timer); // Clean up the timer
        }
    }, [location]);

    const handleCloseDialog = (confirm) => {
        setOpenDialog(false); // Close the dialog
        if (confirm) {
            navigate('/'); // Redirect to home if confirmed
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('orderData');
        localStorage.removeItem('orderItems');
        navigate('/');
    };

    const handleAddQuantity = (menuItemId) => {
        setOrderData((prevOrderData) => {
            const updatedMenuItems = prevOrderData.menuItems.map((item) =>
                item.menuItemId === menuItemId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
            return {
                ...prevOrderData,
                menuItems: updatedMenuItems,
                totalPrice: updatedMenuItems.reduce((total, item) => total + item.quantity * item.price, 0).toFixed(2)
            };
        });
    };

    const handleRemoveQuantity = (menuItemId) => {
        setOrderData((prevOrderData) => {
            const updatedMenuItems = prevOrderData.menuItems.map((item) =>
                item.menuItemId === menuItemId && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            );
            return {
                ...prevOrderData,
                menuItems: updatedMenuItems,
                totalPrice: updatedMenuItems.reduce((total, item) => total + item.quantity * item.price, 0).toFixed(2)
            };
        });
    };

    const handleCloseAlert = () => {
        setShowAlert(false);
    };

    const handleConfirmOrder = async () => {
        try {
            // เตรียมข้อมูลที่จะส่งไปยัง API
            const payload = {
                tableId: parseInt(orderData.tableId, 10),
                menuItems: orderData.menuItems.map(item => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity
                }))
            };
            console.log("Payload:", payload);

            // ส่งข้อมูลไปยัง API
            const response = await axios.post('http://localhost:1323/api/v1/restaurant/order/menu', payload);

            // แสดงข้อความหรือเปลี่ยนหน้าเมื่อทำสำเร็จ
            console.log(response.data);
            if (response.data.code === "S0000") {
                setAlertMessage('Order successfully.');
                setAlertSeverity('success');
                setAlertTitle('Success');
                setShowAlert(true);
                localStorage.removeItem('orderData');
                localStorage.removeItem('orderItems');
                setTimeout(() => {
                    navigate(`/get/menu`, { state: { tableNumber: orderData.tableId } });
                }, 3000);
            }
        } catch (err) {
            console.log(error.response.data)
            if (error.response) {
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
    };

    return (
        <div>
            <Container>
                <Box
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="100vh"
                >
                    <Box
                        component="form"
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            width: '300px',
                            padding: 3,
                            boxShadow: 3,
                            borderRadius: 2,
                            mb: 2,
                            mt: 2
                        }}
                    >
                        <Typography variant="h4" fontWeight={600} align="center">
                            Restaurant Go
                        </Typography>
                        {/* Show Table Number */}
                        <Typography variant="h6" align="center">
                            {orderData && <p>Table Number : {orderData.tableId}</p>}
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleLogout}
                        >
                            Check Out
                        </Button>
                    </Box>

                    {/* Show Order Items */}
                {loading ? (
                    <CircularProgress />
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : (
                    <>
                        <List>
                            {orderData.menuItems.map((item, index) => (
                                <ListItem key={index}>
                                    <Card sx={{ display: 'flex', alignItems: 'center', mb: 2, width: 500 }}>
                                        <CardMedia
                                            component="img"
                                            sx={{ width: 100, height: 100, marginRight: 2 }}
                                            image={item.base64}    // แสดงรูปเมนู
                                            alt={item.name}
                                        />
                                        <ListItemText
                                            primary={`Menu: ${item.name}`}  // แสดงชื่อเมนู
                                            secondary={`Price: ฿${item.price.toFixed(2)}`}
                                        />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <IconButton
                                                aria-label="remove"
                                                onClick={() => handleRemoveQuantity(item.menuItemId)}
                                            >
                                                <RemoveIcon />
                                            </IconButton>
                                            <Typography>{item.quantity}</Typography>
                                            <IconButton
                                                aria-label="add"
                                                onClick={() => handleAddQuantity(item.menuItemId)}
                                            >
                                                <AddIcon />
                                            </IconButton>
                                        </Box>
                                    </Card>
                                </ListItem>
                            ))}
                        </List>
                        <Typography variant="h6">
                            Total Price: ฿{orderData.totalPrice}
                        </Typography>

                        {/* ปุ่ม Confirm */}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleConfirmOrder}
                            sx={{ mt: 2 }}
                        >
                            Confirm Order
                        </Button>
                    </>
                )}
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

            {/* Confirmation Dialog */}
            <Dialog open={openDialog} onClose={() => handleCloseDialog(true)} disableEscapeKeyDown>
                <DialogTitle>กำลังเปลี่ยนเส้นทาง</DialogTitle>
                <DialogContent>
                    <Typography>ไม่พบ table id ระบบจะนำพาท่านกลับสู่หน้าหลัก</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleCloseDialog(true)} color="primary">ตกลง</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
