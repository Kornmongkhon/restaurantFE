import React, { useEffect, useState } from 'react'
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Box, Container, Typography, Button,
    CircularProgress, Card, CardContent, CardActions, Alert, AlertTitle, Rating, TextField,
    Grid
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export const ViewOrder = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState(null)
    const [orderItems, setOrderItems] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDialogOrder, setOpenDialogOrder] = useState(false);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('info');
    const [alertTitle, setAlertTitle] = useState('info');
    const [showAlert, setShowAlert] = useState(false);
    const [ratings, setRatings] = useState({}); // State to store ratings
    const [comments, setComments] = useState({});
    const [ratingDisabled, setRatingDisabled] = useState({});
    useEffect(() => {
        // check table id
        if (!location.state || !location.state.tableId) {
            console.log("Please enter table id!");
            setOpenDialog(true);
        } else {
            const delayFetchOrder = async () => {
                await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 sec
                fetchOrder();
            };
            delayFetchOrder();
        }
    }, [location]);
    const handleLogout = async () => {
        localStorage.removeItem('orderData');
        localStorage.removeItem('orderItems');
        try {
            const deleteResponse = await axios.delete('http://localhost:1323/api/v1/restaurant/order/delete/all', {
                data: { tableId: parseInt(location.state.tableId, 10) }
            });

            if (deleteResponse.data.code === "S0000") {
                console.log('Orders deleted successfully.');
                console.log(deleteResponse.data)
                const updateResponse = await axios.patch('http://localhost:1323/api/v1/restaurant/table/update', {
                    tableId: parseInt(location.state.tableId, 10),
                    tableStatus: 'available'
                });

                if (updateResponse.data.code === "S0000") {
                    console.log('Table status updated to available.');
                    console.log(updateResponse.data)
                } else {
                    console.error('Failed to update table status.');
                    console.log(updateResponse.data)
                }
            } else {
                console.error('Failed to delete orders.');
                console.log(deleteResponse.data)
            }

            navigate('/');
        } catch (err) {
            console.error('Error while logging out:', err);
            console.log(err.response.data)
        }
    };
    const fetchOrder = async () => {
        try {
            const payload = {
                tableId: parseInt(location.state.tableId, 10),
            };
            console.log(payload);
            const response = await axios.post('http://localhost:1323/api/v1/restaurant/order/history', payload);
            console.log(response.data);
            if (response.data.code === "S0000") {
                setOrderItems(response.data.data);
            }
        } catch (error) {
            setError(error.response.data.message);
            console.log(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };
    const viewDetails = async (orderId) => {
        try {
            const payload = {
                tableId: parseInt(location.state.tableId, 10),
                orderId: parseInt(orderId, 10)
            };
            console.log("Payload:", payload);
            const response = await axios.post('http://localhost:1323/api/v1/restaurant/order/details', payload);

            console.log(response.data);
            if (response.data.code === "S0000") {
                setOrderDetails(response.data.data);
            } else {
                setOrderDetails(null);
            }
        } catch (err) {
            console.error(err); // Log the full error for better debugging
            setError(err.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
            setOpenDialogOrder(true);
        }
    };
    const handlePayment = async (orderId) => {
        try {
            const payload = {
                tableId: parseInt(location.state.tableId, 10), // ค่าจาก state
                orderId: parseInt(orderId, 10), // ค่าจาก parameter
            };
            console.log("Payload:", payload);
            const response = await axios.post('http://localhost:1323/api/v1/restaurant/order/pay', payload);
            console.log(response.data);
            // ตรวจสอบการตอบกลับจากเซิร์ฟเวอร์
            if (response.data.code === "S0000") {
                showAlerts('Payment successful!', 'success', 'Success');
                setTimeout(() => {
                    fetchOrder(); // เรียก fetchOrder ใหม่หลังจากแสดง alert
                }, 1000);
            }
        } catch (err) {
            console.error(err.response?.data?.message);
            showAlerts(err.response.data.message, 'error', 'Error');
        }
    };
    const handleCloseAlert = () => {
        setShowAlert(false);
    };
    const handleCloseDialog = (confirm) => {
        setOpenDialog(false); // Close the dialog
        if (confirm) {
            navigate('/'); // Redirect to home if confirmed
        }
    };
    const handleCloseDialogDetails = () => {
        setOpenDialogOrder(false);
    };
    const calculateTotalPrice = () => {
        if (orderDetails && orderDetails.orderItems.length > 0) {
            return orderDetails.orderItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
        }
        return 0;
    };
    const handleRatingChange = (orderId, newRating) => {
        setRatings((prev) => ({ ...prev, [orderId]: newRating }));
    };

    const handleCommentChange = (orderId, newComment) => {
        setComments((prev) => ({ ...prev, [orderId]: newComment }));
    };
    const submitRating = async (orderId) => {
        const payload = {
            orderId: orderId,
            rating: ratings[orderId],
            comment: comments[orderId],
        };
        console.log(payload);
        try {
            const response = await axios.post('http://localhost:1323/api/v1/restaurant/order/review', payload);
            if (response.data.code === "S0000") {
                showAlerts('Thank you for your feedback!', 'success', 'Success');
                setRatings((prev) => ({ ...prev, [orderId]: 0 })); // Reset rating
                setComments((prev) => ({ ...prev, [orderId]: '' })); // Reset comment
                setRatingDisabled((prev) => ({ ...prev, [orderId]: true }));
            } else {
                if (response.data.message === "Invalid request, Order has already been reviewed.") {
                    setRatingDisabled((prev) => ({ ...prev, [orderId]: true })); // Disable if already reviewed
                    showAlerts(response.data.message, 'warning', 'Warning'); // Show warning alert
                } else {
                    showAlerts(response.data.message, 'error', 'Error');
                }
            }
        } catch (error) {
            console.error(error.response.data.message);
            showAlerts(error.response.data.message, 'error', 'Error');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'created':
                return 'blue';
            case 'prepare':
                return 'orange';
            case 'canceled':
                return 'red';
            case 'completed':
                return 'green';
            case 'paid':
                return 'gray';
            default:
                return 'black';
        }
    };
    const showAlerts = (message, severity, title) => {
        setAlertMessage(message);
        setAlertSeverity(severity);
        setAlertTitle(title);
        setShowAlert(true);
    };

    return (
        <div>
            <Container sx={{ mt: 4, mb: 4 }}>
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
                            mt: 12
                        }}
                    >
                        <Typography variant="h4" fontWeight={600} align="center">
                            Restaurant Go
                        </Typography>
                        <Typography variant="h6" align="center">
                            {location.state && <p>Table Number : {location.state.tableId}</p>}
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleLogout}
                        >
                            Check Out
                        </Button>
                    </Box>

                    {/* Show Menu with Grid Layout */}
                    {loading ? (
                        <CircularProgress />
                    ) : error ? (
                        <Typography color="error">{error}</Typography>
                    ) : (
                        <Grid container spacing={2}>
                            {orderItems.map((order, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card sx={{ minWidth: 275 }}>
                                        <CardContent>
                                            <Typography variant="h5" component="div">
                                                Order #{order.orderId}
                                            </Typography>
                                            <Typography color="primary">
                                                Table ID : {order.tableId}
                                            </Typography>
                                            <Typography display='flex'>
                                                <Typography color='secondary' sx={{ marginRight: 1 }}>Status :</Typography>
                                                <Typography sx={{ color: getStatusColor(order.status) }}>{order.status}</Typography>
                                            </Typography>
                                            <Typography variant="body2">
                                                Created At: {new Date(order.createdAt).toLocaleString()}
                                            </Typography>
                                        </CardContent>
                                        <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Button
                                                size="small"
                                                color="primary"
                                                onClick={() => viewDetails(order.orderId)}
                                            >
                                                View Details
                                            </Button>
                                            {order.status === 'completed' && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="success"
                                                    onClick={() => handlePayment(order.orderId)}
                                                >
                                                    Pay
                                                </Button>
                                            )}
                                        </CardActions>
                                        {order.status === 'paid' && !ratingDisabled[order.orderId] && (
                                            <Box sx={{ padding: 2 }}>
                                                <Typography variant="body1">Rate your experience:</Typography>
                                                <Rating
                                                    name={`rating-${order.orderId}`}
                                                    value={ratings[order.orderId] || 0}
                                                    onChange={(event, newValue) => handleRatingChange(order.orderId, newValue)}
                                                />
                                                <TextField
                                                    label="Comment"
                                                    variant="outlined"
                                                    value={comments[order.orderId] || ''}
                                                    onChange={(event) => handleCommentChange(order.orderId, event.target.value)}
                                                    fullWidth
                                                    sx={{ marginTop: 1 }}
                                                />
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() => submitRating(order.orderId)}
                                                    sx={{ marginTop: 1 }}
                                                >
                                                    Submit
                                                </Button>
                                            </Box>
                                        )}
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            </Container>

            <Dialog
                open={openDialogOrder}
                onClose={handleCloseDialogDetails}
                fullWidth
                maxWidth="sm"
                disableEscapeKeyDown
                disableScrollLock // Prevents scroll locking
                PaperProps={{
                    style: { backgroundColor: 'white' }, // Set background color to white
                }}
            >
                <DialogTitle>Order Details</DialogTitle>
                <DialogContent>
                    {loading ? (
                        <CircularProgress />
                    ) : error ? (
                        <Typography color="error">{error}</Typography>
                    ) : orderDetails && orderDetails.orderItems.length > 0 ? ( // Check if orderDetails exists and has items
                        <Box>
                            <Typography variant="h6">Order ID: {orderDetails.orderId}</Typography>
                            <Typography>Status: {orderDetails.status}</Typography>
                            <Typography>Table ID: {orderDetails.tableId}</Typography>
                            <Typography variant="h6" mt={2}>Order Items:</Typography>
                            {orderDetails.orderItems.map((item, index) => (
                                <Box key={index} mt={1}>
                                    <Typography>Name: {item.name}</Typography>
                                    <Typography>Description: {item.description}</Typography>
                                    <Typography>Quantity: {item.quantity}</Typography>
                                    <Typography>Price: {item.price}</Typography>
                                </Box>
                            ))}
                            <Typography variant="h6" mt={2}>Total Price: ${calculateTotalPrice()}</Typography> {/* แสดงราคารวม */}
                        </Box>
                    ) : (
                        <Typography>No order details available.</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogDetails} color="secondary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

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
        </div>
    )
}
