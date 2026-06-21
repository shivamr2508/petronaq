import "../styles/policy.css";

function ShippingPolicyPage() {
  return (
    <div className="policy-container">
      <h2>Shipping Policy</h2>

      <section>
        <h3>Order Processing</h3>
        <p>Orders are processed within <strong>1-2 business days</strong>.</p>
      </section>

      <section>
        <h3>Estimated Delivery Times</h3>
        <p>
          <strong>Gujarat:</strong> 2-4 business days
        </p>
        <p>
          <strong>Other Indian cities:</strong> 3-7 business days
        </p>
      </section>

      <section>
        <h3>Important Notice</h3>
        <p>
          Delivery timelines may vary due to courier delays, weather conditions, 
          public holidays or other circumstances beyond our control.
        </p>
      </section>

      <section>
        <h3>Shipping Queries</h3>
        <p>
          For shipping related queries, please contact us at: <br />
          <strong>Email: team@petronaq.in</strong>
        </p>
      </section>
    </div>
  );
}

export default ShippingPolicyPage;
