import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database';

// --- Business Settings ---
export class BusinessSettings extends Model {}
BusinessSettings.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  businessName: { type: DataTypes.STRING, defaultValue: 'My Business' },
  address: { type: DataTypes.TEXT },
  phone: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  gstNumber: { type: DataTypes.STRING },
  panNumber: { type: DataTypes.STRING },
  logo: { type: DataTypes.TEXT }, // base64
  letterhead: { type: DataTypes.TEXT }, // base64
  signature: { type: DataTypes.TEXT }, // base64
  bankName: { type: DataTypes.STRING },
  branch: { type: DataTypes.STRING },
  accountNumber: { type: DataTypes.STRING },
  ifscCode: { type: DataTypes.STRING },
  invoicePrefix: { type: DataTypes.STRING, defaultValue: 'INV-' },
  defaultNotes: { type: DataTypes.TEXT },
  defaultTax: { type: DataTypes.FLOAT, defaultValue: 0 },
  defaultTemplate: { type: DataTypes.STRING, defaultValue: 'classic' }
}, { sequelize, modelName: 'BusinessSettings' });

// --- Customers ---
export class Customer extends Model {}
Customer.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  gstNumber: { type: DataTypes.STRING }
}, { sequelize, modelName: 'Customer' });

// --- Items (Price List) ---
export class Item extends Model {}
Item.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  itemName: { type: DataTypes.STRING, allowNull: false },
  itemCode: { type: DataTypes.STRING },
  unit: { type: DataTypes.STRING, defaultValue: 'pcs' },
  rate: { type: DataTypes.FLOAT, allowNull: false },
  gst: { type: DataTypes.FLOAT, defaultValue: 0 }
}, { sequelize, modelName: 'Item' });

// --- Bills ---
export class Bill extends Model {}
Bill.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  billNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  invoiceDate: { type: DataTypes.DATE, allowNull: false },
  orderDate: { type: DataTypes.DATE },
  vendorCode: { type: DataTypes.STRING },
  woNumber: { type: DataTypes.STRING },
  woDate: { type: DataTypes.DATE },
  customerId: { type: DataTypes.UUID, allowNull: true },
  customerSnapshot: { type: DataTypes.JSON, allowNull: false }, // Store full details in case customer is deleted/changed
  subtotal: { type: DataTypes.FLOAT, defaultValue: 0 },
  taxAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  discount: { type: DataTypes.FLOAT, defaultValue: 0 },
  grandTotal: { type: DataTypes.FLOAT, defaultValue: 0 },
  amountInWords: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
  templateType: { type: DataTypes.STRING, defaultValue: 'classic' },
  bankDetailsSnapshot: { type: DataTypes.JSON }, // capture bank details at time of billing
  
  // Payment Tracking
  amountPaid: { type: DataTypes.FLOAT, defaultValue: 0 },
  balanceDue: { type: DataTypes.FLOAT, defaultValue: 0 },
  paymentStatus: { type: DataTypes.STRING, defaultValue: 'Unpaid' } // Unpaid, Partially Paid, Paid
}, { sequelize, modelName: 'Bill' });

// --- Bill Items ---
export class BillItem extends Model {}
BillItem.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  billId: { type: DataTypes.UUID, allowNull: false },
  itemId: { type: DataTypes.UUID, allowNull: true },
  itemName: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
  quantity: { type: DataTypes.FLOAT, allowNull: false },
  unit: { type: DataTypes.STRING, defaultValue: 'pcs' },
  rate: { type: DataTypes.FLOAT, allowNull: false },
  gst: { type: DataTypes.FLOAT, defaultValue: 0 },
  amount: { type: DataTypes.FLOAT, allowNull: false } // qty * rate
}, { sequelize, modelName: 'BillItem' });

// --- Payments ---
export class Payment extends Model {}
Payment.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  billId: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  paymentDate: { type: DataTypes.DATE, allowNull: false },
  notes: { type: DataTypes.TEXT }
}, { sequelize, modelName: 'Payment' });

// --- Quotations ---
export class Quotation extends Model {}
Quotation.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  quotationNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  quotationDate: { type: DataTypes.DATE, allowNull: false },
  validUntil: { type: DataTypes.DATE },
  customerId: { type: DataTypes.UUID, allowNull: true },
  customerSnapshot: { type: DataTypes.JSON, allowNull: false },
  subtotal: { type: DataTypes.FLOAT, defaultValue: 0 },
  taxAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  discount: { type: DataTypes.FLOAT, defaultValue: 0 },
  grandTotal: { type: DataTypes.FLOAT, defaultValue: 0 },
  amountInWords: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
  templateType: { type: DataTypes.STRING, defaultValue: 'classic' },
  bankDetailsSnapshot: { type: DataTypes.JSON },
  status: { type: DataTypes.STRING, defaultValue: 'Draft' }, // Draft, Sent, Accepted, Rejected, Converted
  convertedToBillId: { type: DataTypes.UUID, allowNull: true }
}, { sequelize, modelName: 'Quotation' });

// --- Quotation Items ---
export class QuotationItem extends Model {}
QuotationItem.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  quotationId: { type: DataTypes.UUID, allowNull: false },
  itemId: { type: DataTypes.UUID, allowNull: true },
  itemName: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
  quantity: { type: DataTypes.FLOAT, allowNull: false },
  unit: { type: DataTypes.STRING, defaultValue: 'pcs' },
  rate: { type: DataTypes.FLOAT, allowNull: false },
  gst: { type: DataTypes.FLOAT, defaultValue: 0 },
  amount: { type: DataTypes.FLOAT, allowNull: false }
}, { sequelize, modelName: 'QuotationItem' });

// Relationships
Bill.hasMany(BillItem, { foreignKey: 'billId', as: 'items', onDelete: 'CASCADE' });
BillItem.belongsTo(Bill, { foreignKey: 'billId' });

Bill.hasMany(Payment, { foreignKey: 'billId', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(Bill, { foreignKey: 'billId' });

Quotation.hasMany(QuotationItem, { foreignKey: 'quotationId', as: 'items', onDelete: 'CASCADE' });
QuotationItem.belongsTo(Quotation, { foreignKey: 'quotationId' });

// Seed Default Settings
export const initDB = async () => {
  try {
    await sequelize.query('PRAGMA foreign_keys = OFF');
    await sequelize.query('DROP TABLE IF EXISTS `Bills_backup`');
    await sequelize.query('DROP TABLE IF EXISTS `BillItems_backup`');
    await sequelize.sync({ alter: true });
    await sequelize.query('PRAGMA foreign_keys = ON');
  } catch (err) {
    console.error("Database Sync Error:", err);
  }
  
  const settingsCount = await BusinessSettings.count();
  if (settingsCount === 0) {
    await BusinessSettings.create({});
  }
};
