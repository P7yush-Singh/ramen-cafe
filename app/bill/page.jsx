"use client";

export default function BillPage() {
  const handleRequestBill = () => {
    alert("Bill generation request has been sent.");
  };

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-10">
      <div className="mx-auto max-w-md rounded-[28px] border border-[#E5DED2] bg-[#FFFDF8] p-6 shadow-[0_8px_30px_rgba(32,24,18,0.06)]">
        <div className="mb-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
            Bill
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#1E1A17]">
            Request Bill
          </h1>
        </div>

        <div className="mb-6 rounded-2xl border border-[#E7E0D5] bg-[#F8F3ED] p-4 text-sm text-[#4F4943]">
          <p className="font-medium text-[#1E1A17]">Table: T-12</p>
          <p className="mt-2">Your bill can be requested from the staff at any time.</p>
        </div>

        <button
          type="button"
          onClick={handleRequestBill}
          className="w-full rounded-full bg-[#1D1A17] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b2622]"
        >
          Request Bill
        </button>
      </div>
    </main>
  );
}
