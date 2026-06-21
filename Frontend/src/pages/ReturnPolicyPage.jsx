import "../styles/policy.css";

function ReturnPolicyPage() {
  return (
    <div className="policy-container">
      <h2>Return Policy</h2>

      <section>
        <h3>We Accept Returns For</h3>
        <p>✓ Damaged products</p>
        <p>✓ Defective products</p>
        <p>✓ Incorrect products received</p>
      </section>

      <section>
        <h3>Return Conditions</h3>
        <p>
          <strong>Contact Within 48 Hours:</strong> Customer must contact us within 
          48 hours of delivery.
        </p>
        <p>
          <strong>Product Condition:</strong> Product must be unused and in original packaging.
        </p>
        <p>
          <strong>Refund Processing:</strong> Refunds will be processed after verification.
        </p>
      </section>

      <section>
        <h3>Return Queries</h3>
        <p>
          For return related queries, please contact us at: <br />
          <strong>Email: team@petronaq.in</strong>
        </p>
      </section>
    </div>
  );
}

export default ReturnPolicyPage;
