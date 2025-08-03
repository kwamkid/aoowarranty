export default function TestPage() {
  return (
    <div className="p-8 bg-primary-500">
      <h1 className="text-4xl font-bold text-white mb-4">
        ทดสอบ Tailwind CSS
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p className="text-secondary-800 text-lg">
          ถ้าเห็นสีแดงและข้อความสวย แสดงว่า Tailwind ทำงาน!
        </p>
        <button className="btn-primary mt-4">
          ปุ่มทดสอบ
        </button>
      </div>
    </div>
  )
}