import { ChatMessage, Product, QuickReply, AgenticState, DeliveryAddress, CartItem } from "@/data/gptCommerceData";
import { MerchantShipping } from "./AddressShippingSelector";
import { ChatLanding } from "./ChatLanding";
import { ChatThread } from "./ChatThread";

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-pending',
  role: 'assistant',
  content: 'سلام! 👋 من دستیار خرید هوشمند پت آباد هستم. چطور می‌تونم کمکت کنم؟\n\nمی‌تونی بگی دنبال چی می‌گردی، یا از من بخوای محصولات رو مقایسه کنم.',
  timestamp: new Date(),
};

interface ChatInterfaceProps {
  isPendingNewChat?: boolean;
  messages: ChatMessage[];
  onSendMessage: (message: string, forceNew?: boolean) => void;
  onAddToCart: (product: Product) => void;
  onCompare: (product: Product) => void;
  onSaveProduct?: (product: Product) => void;
  cartItems: CartItem[];
  isProcessing: boolean;
  onCheckout: () => void;
  hasStartedChat: boolean;
  onStartChat: () => void;
  isCartOpen: boolean;
  onSignIn: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  setInputValue?: (value: string) => void;
  savedProductIds?: string[];
  onInlineProductDetails?: (product: Product) => void;
  onQuickReply?: (reply: QuickReply) => void;
  onFinalizePurchase?: () => void;
  onAddressConfirm?: () => void;
  onAddressSelect?: (addressId: string) => void;
  selectedAddressId?: string | null;
  merchantShipping?: MerchantShipping[];
  selectedShippingByMerchant?: Record<string, string>;
  onSelectShipping?: (merchantId: string, shippingId: string) => void;
  onAddNewAddress?: (address: Omit<DeliveryAddress, "id">) => void;
  onPaymentSelect?: (paymentId: string) => void;
  agenticState?: AgenticState;
  isAuthenticated?: boolean;
  userFirstName?: string;
}

export const ChatInterface = (props: ChatInterfaceProps) => {
  if (props.isPendingNewChat) {
    return (
      <ChatThread
        messages={[WELCOME_MESSAGE]}
        onSendMessage={props.onSendMessage}
        onAddToCart={props.onAddToCart}
        onCompare={props.onCompare}
        onSaveProduct={props.onSaveProduct}
        cartItems={props.cartItems}
        isProcessing={props.isProcessing}
        isCartOpen={props.isCartOpen}
        onSignIn={props.onSignIn}
        inputRef={props.inputRef}
        setInputValue={props.setInputValue}
        savedProductIds={props.savedProductIds}
        onInlineProductDetails={props.onInlineProductDetails}
        onQuickReply={props.onQuickReply}
        onFinalizePurchase={props.onFinalizePurchase}
        onAddressConfirm={props.onAddressConfirm}
        onAddressSelect={props.onAddressSelect}
        selectedAddressId={props.selectedAddressId}
        merchantShipping={props.merchantShipping}
        selectedShippingByMerchant={props.selectedShippingByMerchant}
        onSelectShipping={props.onSelectShipping}
        onAddNewAddress={props.onAddNewAddress}
        onPaymentSelect={props.onPaymentSelect}
        agenticState={props.agenticState}
      />
    );
  }

  if (!props.hasStartedChat) {
    return (
      <ChatLanding
        onSendMessage={props.onSendMessage}
        onAddToCart={props.onAddToCart}
        onStartChat={props.onStartChat}
        onCheckout={props.onCheckout}
        onSignIn={props.onSignIn}
        cartItems={props.cartItems}
        isCartOpen={props.isCartOpen}
        isProcessing={props.isProcessing}
        setInputValue={props.setInputValue}
        inputRef={props.inputRef}
        isAuthenticated={props.isAuthenticated}
        userFirstName={props.userFirstName}
      />
    );
  }

  return (
    <ChatThread
      messages={props.messages}
      onSendMessage={props.onSendMessage}
      onAddToCart={props.onAddToCart}
      onCompare={props.onCompare}
      onSaveProduct={props.onSaveProduct}
      cartItems={props.cartItems}
      isProcessing={props.isProcessing}
      isCartOpen={props.isCartOpen}
      onSignIn={props.onSignIn}
      inputRef={props.inputRef}
      setInputValue={props.setInputValue}
      savedProductIds={props.savedProductIds}
      onInlineProductDetails={props.onInlineProductDetails}
      onQuickReply={props.onQuickReply}
      onFinalizePurchase={props.onFinalizePurchase}
      onAddressConfirm={props.onAddressConfirm}
      onAddressSelect={props.onAddressSelect}
      selectedAddressId={props.selectedAddressId}
      merchantShipping={props.merchantShipping}
      selectedShippingByMerchant={props.selectedShippingByMerchant}
      onSelectShipping={props.onSelectShipping}
      onAddNewAddress={props.onAddNewAddress}
      onPaymentSelect={props.onPaymentSelect}
      agenticState={props.agenticState}
    />
  );
};
