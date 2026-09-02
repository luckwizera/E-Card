import express from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const db=new Database(process.env.DB_FILE||path.join(__dirname,'ecard.sqlite'));
const secret=process.env.JWT_SECRET||'change-this-in-production';
const app=express();
app.use(cors({origin:process.env.APP_ORIGIN||true,credentials:true}));
app.use(express.json({limit:'1mb'})); app.use(cookieParser());

db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','student')),student_id TEXT); CREATE TABLE IF NOT EXISTS students(id TEXT PRIMARY KEY,name TEXT NOT NULL,class_name TEXT NOT NULL,parent_email TEXT,parent_phone TEXT,marks INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'Good'); CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT,student_id TEXT NOT NULL,type TEXT NOT NULL,amount INTEGER NOT NULL,reason TEXT NOT NULL,created_at TEXT NOT NULL,created_by INTEGER,notified INTEGER NOT NULL DEFAULT 0); CREATE TABLE IF NOT EXISTS permissions(code TEXT PRIMARY KEY,student_id TEXT NOT NULL,reason TEXT NOT NULL,out_time TEXT NOT NULL,back_time TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Pending',created_at TEXT NOT NULL);`);

function seed(){if(!db.prepare('SELECT COUNT(*) n FROM students').get().n){const add=db.prepare('INSERT INTO students VALUES(?,?,?,?,?,?,?)');[['ST-1024','Aline Uwase','S4 A','parent@example.com','+250000000000',8,'Good'],['ST-1041','Brian Mugisha','S3 B','parent@example.com','+250000000001',14,'Watch'],['ST-1068','Clara Ishimwe','S5 C','parent@example.com','+250000000002',3,'Excellent'],['ST-1089','David Niyonzima','S2 A','parent@example.com','+250000000003',19,'Review']].forEach(x=>add.run(...x));}}
seed();
function token(u){return jwt.sign({id:u.id,role:u.role,studentId:u.student_id},secret,{expiresIn:'8h'})}
function auth(req,res,next){try{const t=req.cookies.ecard||req.headers.authorization?.replace('Bearer ','');if(!t)throw 0;req.user=jwt.verify(t,secret);next()}catch{res.status(401).json({error:'Authentication required'})}}
function admin(req,res,next){if(req.user.role!=='admin')return res.status(403).json({error:'Administration access required'});next()}

app.post('/api/auth/login',(req,res)=>{const {email,password}=req.body||{};const u=db.prepare('SELECT * FROM users WHERE email=?').get(email);if(!u||!bcrypt.compareSync(password,u.password_hash))return res.status(401).json({error:'Invalid credentials'});res.cookie('ecard',token(u),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:28800000});res.json({user:{id:u.id,name:u.name,email:u.email,role:u.role,studentId:u.student_id}})});
app.post('/api/auth/logout',(req,res)=>{res.clearCookie('ecard');res.json({ok:true})});
app.get('/api/me',auth,(req,res)=>res.json(req.user));
app.get('/api/students',auth,admin,(req,res)=>res.json(db.prepare('SELECT id,name,class_name AS class,marks,status,parent_email,parent_phone FROM students ORDER BY name').all()));
app.get('/api/students/:id/history',auth,(req,res)=>{if(req.user.role==='student'&&req.user.studentId!==req.params.id)return res.status(403).json({error:'Forbidden'});res.json(db.prepare('SELECT * FROM events WHERE student_id=? ORDER BY created_at DESC').all(req.params.id))});
app.post('/api/events',auth,admin,(req,res)=>{const {studentId,type,amount,reason,notifyParent}=req.body||{};if(!['Appreciation','Sanction'].includes(type)||!Number.isInteger(amount)||amount<1||amount>20||!reason?.trim())return res.status(400).json({error:'Invalid conduct record'});const s=db.prepare('SELECT * FROM students WHERE id=?').get(studentId);if(!s)return res.status(404).json({error:'Student not found'});const delta=type==='Appreciation'?amount:-amount;const marks=Math.max(0,s.marks+delta);const status=marks>=18?'Review':marks>=12?'Watch':'Good';const now=new Date().toISOString();db.transaction(()=>{db.prepare('UPDATE students SET marks=?,status=? WHERE id=?').run(marks,status,studentId);db.prepare('INSERT INTO events(student_id,type,amount,reason,created_at,created_by,notified) VALUES(?,?,?,?,?,?,?)').run(studentId,type,amount,reason.trim(),now,req.user.id,notifyParent?1:0)})();res.json({studentId,marks,status})});
app.post('/api/permissions',auth,admin,(req,res)=>{const {studentId,reason,outTime,backTime}=req.body||{};if(!studentId||!reason||!outTime||!backTime)return res.status(400).json({error:'All fields are required'});const code='EC-'+Math.random().toString(36).slice(2,6).toUpperCase();db.prepare('INSERT INTO permissions VALUES(?,?,?,?,?,?,?)').run(code,studentId,reason,outTime,backTime,'Pending',new Date().toISOString());res.status(201).json(db.prepare('SELECT * FROM permissions WHERE code=?').get(code))});
app.get('/api/permissions',auth,(req,res)=>{const q=req.user.role==='student'?db.prepare('SELECT * FROM permissions WHERE student_id=? ORDER BY created_at DESC').all(req.user.studentId):db.prepare('SELECT * FROM permissions ORDER BY created_at DESC').all();res.json(q)});
app.patch('/api/permissions/:code',auth,admin,(req,res)=>{const status=req.body?.status;if(!['Approved','Rejected'].includes(status))return res.status(400).json({error:'Invalid status'});db.prepare('UPDATE permissions SET status=? WHERE code=?').run(status,req.params.code);res.json(db.prepare('SELECT * FROM permissions WHERE code=?').get(req.params.code))});
app.get('/api/reports/:period.pdf',auth,admin,(req,res)=>{if(!['monthly','termly','annual'].includes(req.params.period))return res.sendStatus(400);const students=db.prepare('SELECT * FROM students ORDER BY marks DESC').all();res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="${req.params.period}-conduct-report.pdf"`);const doc=new PDFDocument({margin:50});doc.pipe(res);doc.fontSize(22).text('E-Card Conduct Report');doc.fontSize(11).text(`${req.params.period.toUpperCase()} · Generated ${new Date().toLocaleString()}`).moveDown();students.forEach(s=>doc.fontSize(13).text(`${s.name} (${s.id}) — ${s.class_name}: ${s.marks} marks — ${s.status}`).fontSize(10).text(`Parent contact: ${s.parent_email||'not configured'}`).moveDown(0.7));doc.end()});

let transporter=null;if(process.env.SMTP_HOST)transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
app.post('/api/notifications/test',auth,admin,async(req,res)=>{if(!transporter)return res.status(503).json({error:'SMTP is not configured'});await transporter.sendMail({from:process.env.SMTP_FROM,to:req.body.to,subject:'E-Card parent update',text:req.body.message||'A school conduct update is available in E-Card.'});res.json({ok:true})});
app.use(express.static(path.join(__dirname,'..')));app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'..','index.html')));
app.listen(Number(process.env.PORT||3000),()=>console.log('E-Card server running'));
