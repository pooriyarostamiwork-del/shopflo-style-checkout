import { z } from "zod";
import { toEnglishDigits } from "./mockVendor";

const digits = (s: string) => toEnglishDigits(s ?? "").replace(/\s/g, "");

export const individualIdentitySchema = z.object({
  fullName: z.string().trim().min(3, "حداقل ۳ کاراکتر"),
  nationalCode: z.string().transform(digits).pipe(z.string().regex(/^\d{10}$/, "کد ملی باید ۱۰ رقم باشد")),
  mobile: z.string().transform(digits).pipe(z.string().regex(/^09\d{9}$/, "فرمت موبایل نامعتبر است")),
  birthDate: z.string().trim().regex(/^[\d۰-۹]{4}\/[\d۰-۹]{2}\/[\d۰-۹]{2}$/, "قالب: ۱۳۷۰/۰۱/۰۱"),
  address: z.string().trim().min(10, "حداقل ۱۰ کاراکتر"),
});

export const companyIdentitySchema = z.object({
  companyName: z.string().trim().min(2, "الزامی"),
  companyNationalId: z.string().transform(digits).pipe(z.string().regex(/^\d{11}$/, "شناسه ملی ۱۱ رقم")),
  registrationNumber: z.string().transform(digits).pipe(z.string().regex(/^\d{3,}$/, "الزامی")),
  repName: z.string().trim().min(3, "الزامی"),
  repNationalCode: z.string().transform(digits).pipe(z.string().regex(/^\d{10}$/, "کد ملی ۱۰ رقم")),
  phone: z.string().transform(digits).pipe(z.string().regex(/^0\d{10}$/, "تلفن نامعتبر")),
  email: z.string().trim().email("ایمیل نامعتبر"),
  address: z.string().trim().min(10, "حداقل ۱۰ کاراکتر"),
});

export const bankingSchema = z.object({
  holder: z.string().trim().min(3, "الزامی"),
  bank: z.string().trim().min(1, "بانک را انتخاب کنید"),
  accountNumber: z.string().transform(digits).pipe(z.string().regex(/^\d{6,}$/, "حداقل ۶ رقم")),
  iban: z.string().transform((s) => toEnglishDigits(s).replace(/\s/g, "").toUpperCase())
    .pipe(z.string().regex(/^IR\d{24}$/, "شبا باید با IR شروع و ۲۴ رقم باشد")),
});

export const taxIndividualSchema = z.object({
  taxCode: z.string().optional().transform((s) => (s ? digits(s) : "")),
  taxFile: z.string().optional().transform((s) => (s ? digits(s) : "")),
});

export const taxCompanySchema = z.object({
  economicCode: z.string().transform(digits).pipe(z.string().regex(/^\d{6,}$/, "الزامی")),
  taxId: z.string().transform(digits).pipe(z.string().regex(/^\d{6,}$/, "الزامی")),
});

export const profileSchema = z.object({
  businessName: z.string().trim().min(2, "الزامی"),
  description: z.string().trim().min(10, "حداقل ۱۰ کاراکتر").max(250, "حداکثر ۲۵۰ کاراکتر"),
  supportPhone: z.string().transform(digits).pipe(z.string().regex(/^0\d{10}$/, "تلفن نامعتبر")),
  businessType: z.string().min(1, "الزامی"),
  website: z.string().trim().url("آدرس نامعتبر").or(z.literal("")),
  operatingHours: z.string().trim().min(3, "الزامی"),
});

export const returnPolicySchema = z.object({
  returnsAccepted: z.enum(["yes", "no"]),
  returnWindow: z.enum(["7", "14", "30"]),
  shippingResponsibility: z.enum(["customer", "merchant", "depends"]),
});

export const accountEmailSchema = z.object({
  email: z.string().trim().email("ایمیل نامعتبر"),
});

export const accountMobileSchema = z.object({
  mobile: z.string().transform(digits).pipe(z.string().regex(/^09\d{9}$/, "فرمت موبایل نامعتبر")),
});

export const withdrawalSchema = (max: number) =>
  z.object({
    amount: z.number({ invalid_type_error: "مبلغ نامعتبر" })
      .min(100_000, "حداقل مبلغ ۱۰۰٬۰۰۰ تومان")
      .max(max, "بیشتر از موجودی قابل برداشت"),
    note: z.string().max(100, "حداکثر ۱۰۰ کاراکتر").optional(),
  });
