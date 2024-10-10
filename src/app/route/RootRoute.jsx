import { Route, Routes } from "react-router-dom";
import { Page } from "../Page";
import { GetMenu } from "../../modules/Menus/GetMenu";
import { OrderSummary } from "../../modules/Order/OrderSummary";
import { ViewOrder } from "../../modules/Order/ViewOrder";

export const RootRoute = () => {
  return (
    <Routes>
        <Route path="/" element={<Page/>}/>
        <Route path="/get/menu" element={<GetMenu/>}/>
        <Route path="/order/summary" element={<OrderSummary/>}/>
        <Route path="/order/view" element={<ViewOrder/>}/>
    </Routes>
  )
}
