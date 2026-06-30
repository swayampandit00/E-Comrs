export interface UserType {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: Category;
  createdAt: string;
}

export interface CartItem {
  cartItemId: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    imageUrl: string;
    category: {
      id: number;
      name: string;
      description: string;
    };
    createdAt: string;
  };
  quantity: number;
  totalPrice: number;
}

export interface Cart {
  cartId: number;
  items: CartItem[];
  totalAmount: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface Payment {
  id: number;
  orderId: number;
  paymentMethod: "UPI" | "CARD" | "COD";
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED";
  transactionId: string;
  createdAt?: string;
}

export interface Order {
  id: number;
  userId: number;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  orderItems: OrderItem[];
  payment: Payment | null;
}

export type Page =
  | "home"
  | "cart"
  | "orders"
  | "profile"
  | "auth"
  | "admin-dashboard"
  | "admin-products"
  | "admin-orders"
  | "admin-users"
  | "admin-categories";

export interface AppState {
  token: string | null;
  user: UserType | null;
  navigate: (page: Page) => void;
}
