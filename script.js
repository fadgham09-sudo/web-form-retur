/**
 * ============================================================
 * 4_Frontend_Logic.js
 * OUTPUT: Integrasi API Apps Script & Manipulasi Form UI
 * ============================================================
 */

// TODO: MASUKKAN URL WEB APP ANDA DI SINI
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyIkeTglGcowMwb9l7mQ6BZFpgk9r6CV2Z-m3rM5OaXAafwiF6t2181NrwZ0vpRrLq7Jg/exec";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("main-form");
  const actionInput = document.getElementById("input-action");
  const btnSubmit = document.getElementById("submit-btn");
  const identitasSection = document.getElementById("identitas-section");
  const nomorInput = document.getElementById("nomor_pemesanan");
  const alertBox = document.getElementById("alert-box");
  
  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    // UI State: Loading
    const originalBtnText = btnSubmit.innerText;
    btnSubmit.innerText = "Memproses, mohon tunggu...";
    btnSubmit.disabled = true;
    showAlert("", "hidden");

    // Persiapkan Data Form
    const formData = new FormData(form);
    const dataObj = Object.fromEntries(formData.entries());
    
    //Persiapkan Data Form
    const formData = new FormData(form);
    const dataObj = Object.fromEntries(formData.entries());

    //TAMBAHAN: Validasi 20 Digit di sisi Client
    if (dataObj.nomor_pemesanan.trim().length !== 20) {
      showAlert("Nomor Pemesanan harus tepat 20 karakter/digit.", "error");
      btnSubmit.innerText = originalBtnText;
      btnSubmit.disabled = false;
      return; // Hentikan proses agar tidak mengirim ke server
    }

    try {
      // POST Fetch ke Google Apps Script
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: new URLSearchParams(dataObj),
        redirect: "follow"
      });

      const result = await response.json();
      handleResponse(result);

    } catch (error) {
      showAlert("Gagal terhubung ke server. Pastikan koneksi internet Anda stabil.", "error");
    } finally {
      btnSubmit.innerText = originalBtnText;
      btnSubmit.disabled = false;
    }
  });

  // Logika Mengelola Balasan dari Apps Script
  function handleResponse(res) {
    const actionState = actionInput.value;

    if (actionState === "cek") {
      if (res.status === "sudah_terdata") {
        showAlert(res.pesan, "error");
      } else if (res.status === "belum_terdata") {
        // Pindah ke State 2: Isi Identitas
        showAlert(res.pesan, "success");
        
        nomorInput.readOnly = true;
        identitasSection.classList.remove("hidden");
        
        // Ubah Indikator Step Panel Kiri
        step1.classList.remove("active");
        step2.classList.add("active");

        actionInput.value = "simpan";
        btnSubmit.innerText = "Simpan Konfirmasi Retur";
      } else {
        showAlert(res.pesan, "error");
      }
    } 
    else if (actionState === "simpan") {
      if (res.status === "success") {
        showAlert("Berhasil! " + res.pesan, "success");
        
        // Reset Form ke awal
        form.reset();
        identitasSection.classList.add("hidden");
        nomorInput.readOnly = false;
        
        step2.classList.remove("active");
        step1.classList.add("active");

        actionInput.value = "cek";
        btnSubmit.innerText = "Cek Nomor Pemesanan";
      } else {
        showAlert(res.pesan, "error");
      }
    }
  }

  function showAlert(message, type) {
    alertBox.innerText = message;
    alertBox.className = "alert " + type;
  }
});
