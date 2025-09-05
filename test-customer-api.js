// Test script to validate EVIDENS customer creation payload against Pagar.me API requirements
// Based on official Pagar.me documentation: https://docs.pagar.me/reference/

console.log('🧪 EVIDENS Customer Creation API Validation');
console.log('===========================================');

// Mock customer data (same format as PaymentForm sends)
const mockCustomerData = {
  customerName: 'João Silva',
  customerEmail: 'joao.silva@example.com',
  customerDocument: '12345678901', // Valid CPF format
  planName: 'Plano Básico'
};

// Simulate our Edge Function's customer creation logic
function buildCustomerPayload(customerData) {
  // Clean and validate document (same logic as Edge Function)
  const cleanDocument = customerData.customerDocument.replace(/\D/g, '');
  const documentLength = cleanDocument.length;
  
  // Determine document type and customer type (same logic as Edge Function)
  let documentType;
  let customerType;
  
  if (documentLength === 11) {
    documentType = 'CPF';
    customerType = 'individual';
  } else if (documentLength === 14) {
    documentType = 'CNPJ';
    customerType = 'company';
  } else {
    documentType = 'PASSPORT';
    customerType = 'individual';
  }

  // Build customer payload (same structure as Edge Function)
  return {
    name: customerData.customerName,
    email: customerData.customerEmail,
    document: cleanDocument,
    document_type: documentType,
    type: customerType,
    // Required phones object for PSP integration
    phones: {
      mobile_phone: {
        country_code: '55',
        area_code: '11',
        number: '999999999'
      }
    },
    // Proper address structure following Pagar.me API
    address: {
      country: 'BR',
      state: 'SP',
      city: 'São Paulo',
      line_1: 'Rua Exemplo, 123',
      line_2: 'Apto 1',
      zip_code: '01310100'
    }
  };
}

// Validate payload structure against Pagar.me documentation
function validatePayload(payload) {
  console.log('\n📋 Validating payload against Pagar.me API requirements:');
  console.log(JSON.stringify(payload, null, 2));
  
  const validations = [];
  
  // Required fields validation
  validations.push({
    field: 'name',
    required: true,
    present: !!payload.name,
    value: payload.name,
    maxLength: 64,
    valid: payload.name && payload.name.length <= 64
  });
  
  validations.push({
    field: 'email',
    required: true,
    present: !!payload.email,
    value: payload.email,
    maxLength: 64,
    valid: payload.email && payload.email.length <= 64
  });
  
  validations.push({
    field: 'document',
    required: true,
    present: !!payload.document,
    value: payload.document,
    valid: payload.document && /^[0-9]+$/.test(payload.document)
  });
  
  validations.push({
    field: 'document_type',
    required: true,
    present: !!payload.document_type,
    value: payload.document_type,
    validValues: ['CPF', 'CNPJ', 'PASSPORT'],
    valid: ['CPF', 'CNPJ', 'PASSPORT'].includes(payload.document_type)
  });
  
  validations.push({
    field: 'type',
    required: true,
    present: !!payload.type,
    value: payload.type,
    validValues: ['individual', 'company'],
    valid: ['individual', 'company'].includes(payload.type)
  });
  
  validations.push({
    field: 'phones.mobile_phone',
    required: true,
    present: !!(payload.phones && payload.phones.mobile_phone),
    value: payload.phones?.mobile_phone,
    valid: !!(payload.phones && payload.phones.mobile_phone && 
             payload.phones.mobile_phone.country_code &&
             payload.phones.mobile_phone.area_code &&
             payload.phones.mobile_phone.number)
  });
  
  validations.push({
    field: 'address',
    required: true,
    present: !!payload.address,
    value: payload.address,
    valid: !!(payload.address && 
             payload.address.country &&
             payload.address.state &&
             payload.address.city &&
             payload.address.zip_code)
  });
  
  console.log('\n✅ Validation Results:');
  console.log('=====================');
  
  let allValid = true;
  validations.forEach(validation => {
    const status = validation.valid ? '✅' : '❌';
    console.log(`${status} ${validation.field}: ${validation.valid ? 'VALID' : 'INVALID'}`);
    if (!validation.valid) {
      allValid = false;
      if (!validation.present) {
        console.log(`   ❌ Missing required field`);
      } else if (validation.validValues) {
        console.log(`   ❌ Invalid value. Expected: ${validation.validValues.join(', ')}, Got: ${validation.value}`);
      } else if (validation.maxLength) {
        console.log(`   ❌ Exceeds max length of ${validation.maxLength}. Got: ${validation.value?.length || 0}`);
      }
    }
  });
  
  console.log(`\n🎯 Overall Status: ${allValid ? 'VALID ✅' : 'INVALID ❌'}`);
  
  return allValid;
}

// Test with mock data
const customerPayload = buildCustomerPayload(mockCustomerData);
const isValid = validatePayload(customerPayload);

console.log('\n📊 Summary:');
console.log('===========');
console.log(`Document: ${mockCustomerData.customerDocument} (${customerPayload.document_type})`);
console.log(`Customer Type: ${customerPayload.type}`);
console.log(`Payload Valid: ${isValid ? 'YES ✅' : 'NO ❌'}`);

if (isValid) {
  console.log('\n🎉 SUCCESS: Customer payload is valid for Pagar.me API!');
  console.log('The Edge Function should now work correctly.');
} else {
  console.log('\n⚠️  FAILED: Customer payload has validation errors.');
  console.log('The Edge Function needs additional fixes.');
}

console.log('\n📖 Reference: https://docs.pagar.me/reference/criar-cliente');