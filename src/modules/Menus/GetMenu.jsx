import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, Button, Card, CardMedia,
    CardContent, Grid, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogTitle,
} from '@mui/material';

export const GetMenu = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [orderItems, setOrderItems] = useState([]);
    const [isBasketLoaded, setIsBasketLoaded] = useState(false);

    useEffect(() => {
        // check table id
        if (!location.state || !location.state.tableNumber) {
            console.log("Please enter table id!")
            setOpenDialog(true);
        } else {
            const delayFetchMenu = async () => {
                await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 sec
                fetchMenu();
            };
            delayFetchMenu();
        }
    }, [location]);

    const handleLogout = () => {
        setOrderItems([]);
        localStorage.removeItem('orderItems');
        navigate('/');
    };

    const fetchMenu = async () => {
        try {
            const response = await axios.get('http://localhost:1323/api/v1/restaurant/all/menu');
            console.log(response.data)
            if (response.data.code === "S0000") {
                setMenuItems(response.data.data);
            }
        } catch (err) {
            setError('Failed to fetch menu items. Please try again later.');
            console.error(error.response.data);
        } finally {
            setLoading(false);
            setIsBasketLoaded(true);
        }
    };

    const handleAddToBasket = (itemId, price, name, base64, isAvailable) => {
        // ตรวจสอบว่า item มี is_available เป็น true หรือไม่
        if (!isAvailable) return; // ถ้า false ให้ไม่ทำอะไร

        setOrderItems((prevOrders) => {
            const existingOrder = prevOrders.find((order) => order.menuItemId === itemId);

            if (existingOrder) {
                // ถ้าเมนูนี้ถูกสั่งแล้ว ให้เพิ่มจำนวน (quantity)
                return prevOrders.map((order) =>
                    order.menuItemId === itemId
                        ? { ...order, quantity: order.quantity + 1 }
                        : order
                );
            } else {
                // ถ้ายังไม่มีในรายการ ให้เพิ่มใหม่
                return [...prevOrders, { menuItemId: itemId, quantity: 1, price, name, base64 }];
            }
        });
    };


    const handleRemoveFromBasket = (itemId) => {
        setOrderItems((prevOrders) => {
            const existingOrder = prevOrders.find((order) => order.menuItemId === itemId);

            if (existingOrder && existingOrder.quantity > 1) {
                return prevOrders.map((order) =>
                    order.menuItemId === itemId
                        ? { ...order, quantity: order.quantity - 1 }
                        : order
                );
            } else {
                // ถ้าจำนวนเป็น 1 แล้วกดลบ จะเอาออกจากตะกร้า
                return prevOrders.filter((order) => order.menuItemId !== itemId);
            }
        });
    };

    const handleCloseDialog = (confirm) => {
        setOpenDialog(false); // Close the dialog
        if (confirm) {
            navigate('/'); // Redirect to home if confirmed
        }
    };

    const handleSubmitOrder = async () => {
        const orderData = {
            tableId: location.state.tableNumber,
            menuItems: orderItems.map(item => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.price,
                name: item.name,        // ส่งชื่อเมนู
                base64: item.base64     // ส่งรูปเมนู
            })),
            totalPrice: orderItems.reduce((total, item) => total + (item.quantity * item.price), 0).toFixed(2)
        };
        console.log(orderData)
        try {
            // ใช้ navigate เพื่อส่ง orderData ไปยัง path อื่น
            navigate('/order/summary', { state: { orderData } });
        } catch (err) {
            console.error('Error while submitting order:', err);
        }
    };

    const getTotalQuantity = () => {
        return orderItems.reduce((total, item) => total + item.quantity, 0);
    };

    const getTotalPrice = () => {
        return orderItems.reduce((total, item) => total + item.quantity * item.price, 0).toFixed(2);
    };

    useEffect(() => {
        // โหลดข้อมูลตะกร้าจาก localStorage เมื่อ component โหลด
        const savedOrderItems = JSON.parse(localStorage.getItem('orderItems')) || [];
        setOrderItems(savedOrderItems);
    }, []);

    useEffect(() => {
        // บันทึกข้อมูลตะกร้าใน localStorage เมื่อ orderItems เปลี่ยนแปลง
        localStorage.setItem('orderItems', JSON.stringify(orderItems));
    }, [orderItems]);

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
                        {/* แสดง Table Number */}
                        <Typography variant="h6" align="center">
                            {location.state && <p>Table Number : {location.state.tableNumber}</p>}
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleLogout}
                        >
                            Check Out
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate('/order/view', { state: { tableId: location.state.tableNumber, } })}
                            sx={{ mt: 0 }}
                        >
                            View Order
                        </Button>
                    </Box>

                    {/* แสดงเมนู */}
                    {loading ? (
                        <CircularProgress />
                    ) : error ? (
                        <Typography color="error">{error}</Typography>
                    ) : (
                        <Grid container spacing={2} justifyContent="flex-start"> {/* align left */}
                            {menuItems.map((item) => (
                                <Grid item xs={12} sm={6} md={3} key={item.menuItemsId}>
                                    <Card sx={{ display: 'flex', flexDirection: 'column', mb: 2, boxShadow: 3, height: '350px' }}>
                                        <CardMedia
                                            component="img"
                                            sx={{ height: '150px', objectFit: 'cover' }} // ขนาดของรูปภาพ
                                            image={item.fileObjects[0].base64}
                                            alt={item.name}
                                        />
                                        <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                            <Typography variant="h6">{item.name}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                                                {item.description}
                                            </Typography>
                                            <Typography variant="h6" color="primary" sx={{ marginTop: 'auto' }}>
                                                ฿{item.price.toFixed(2)}
                                            </Typography>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => handleRemoveFromBasket(item.menuItemsId)}
                                                    disabled={orderItems.find(order => order.menuItemId === item.menuItemsId)?.quantity <= 0 || !item.isAvailable} // Disable ถ้าจำนวนเป็น 0 หรือ isAvailable เป็น false
                                                >
                                                    -
                                                </Button>
                                                <Typography>{orderItems.find(order => order.menuItemId === item.menuItemsId)?.quantity || 0}</Typography>
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => handleAddToBasket(item.menuItemsId, item.price, item.name, item.fileObjects[0].base64, item.isAvailable)}
                                                    disabled={!item.isAvailable} // Disable if not available
                                                >
                                                    +
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* แสดง Basket ตะกร้าสินค้า เฉพาะเมื่อมีรายการ */}
                    {isBasketLoaded && orderItems.length > 0 && (
                        <Box sx={{ mt: 3, mb: 3, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmitOrder}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%',
                                    borderRadius: '1rem', // ปรับเป็นปุ่มยาวและมน
                                    padding: '10px 20px'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            backgroundColor: 'white',
                                            borderRadius: '20%',
                                            padding: '5px',
                                            marginRight: '20px',
                                            minWidth: '40px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            color: 'black',
                                            fontWeight: '700'
                                        }}
                                    >
                                        {getTotalQuantity()}
                                    </Box>
                                    <Typography fontWeight={600} fontSize='1rem'>My Basket</Typography>
                                </Box>
                                <Typography sx={{ fontSize: '1.2rem', fontWeight: '600' }}>
                                    ฿{getTotalPrice()}
                                </Typography>
                            </Button>
                        </Box>
                    )}
                </Box>
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
