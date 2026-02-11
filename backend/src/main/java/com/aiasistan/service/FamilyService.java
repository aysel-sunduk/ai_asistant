package com.aiasistan.service;

import com.aiasistan.common.enums.FamilyTransactionType;
import com.aiasistan.dto.request.FamilyBirthdayRequest;
import com.aiasistan.dto.request.FamilyTransactionRequest;
import com.aiasistan.dto.response.CurrencyRateResponse;
import com.aiasistan.dto.response.FamilyBirthdayResponse;
import com.aiasistan.dto.response.FamilyFinanceSummaryResponse;
import com.aiasistan.dto.response.FamilyTransactionResponse;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.CurrencyCode;
import com.aiasistan.model.FamilyBirthday;
import com.aiasistan.model.FamilyTransaction;
import com.aiasistan.repository.FamilyBirthdayRepository;
import com.aiasistan.repository.FamilyTransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.MonthDay;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FamilyService {

    private final FamilyTransactionRepository transactionRepository;
    private final FamilyBirthdayRepository birthdayRepository;
    private final UserService userService;
    private final CurrencyService currencyService;

    public FamilyService(
        FamilyTransactionRepository transactionRepository,
        FamilyBirthdayRepository birthdayRepository,
        UserService userService,
        CurrencyService currencyService
    ) {
        this.transactionRepository = transactionRepository;
        this.birthdayRepository = birthdayRepository;
        this.userService = userService;
        this.currencyService = currencyService;
    }

    @Transactional
    public FamilyTransactionResponse createTransaction(String userEmail, FamilyTransactionRequest request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        FamilyTransaction tx = new FamilyTransaction();
        tx.setUserId(userId);
        tx.setType(request.getType());
        tx.setAmountMinor(request.getAmountMinor());
        tx.setCurrency(CurrencyCode.fromString(request.getCurrency()));
        tx.setCategory(request.getCategory());
        tx.setOccurredOn(request.getOccurredOn());
        tx.setNote(request.getNote());
        return toTransactionResponse(transactionRepository.save(tx));
    }

    @Transactional(readOnly = true)
    public Page<FamilyTransactionResponse> getTransactions(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        return transactionRepository.findByUserIdOrderByOccurredOnDesc(userId, pageable)
            .map(this::toTransactionResponse);
    }

    @Transactional(readOnly = true)
    public FamilyTransactionResponse getTransaction(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        FamilyTransaction tx = transactionRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Family transaction not found"));
        return toTransactionResponse(tx);
    }

    @Transactional
    public FamilyTransactionResponse updateTransaction(String userEmail, UUID id, FamilyTransactionRequest request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        FamilyTransaction tx = transactionRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Family transaction not found"));
        tx.setType(request.getType());
        tx.setAmountMinor(request.getAmountMinor());
        tx.setCurrency(CurrencyCode.fromString(request.getCurrency()));
        tx.setCategory(request.getCategory());
        tx.setOccurredOn(request.getOccurredOn());
        tx.setNote(request.getNote());
        return toTransactionResponse(transactionRepository.save(tx));
    }

    @Transactional
    public void deleteTransaction(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        FamilyTransaction tx = transactionRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Family transaction not found"));
        transactionRepository.delete(tx);
    }

    @Transactional(readOnly = true)
    public FamilyFinanceSummaryResponse getFinanceSummary(String userEmail, LocalDate startDate, LocalDate endDate) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Long incomeMinor = transactionRepository.sumAmountMinorByTypeAndDateRange(
            userId, FamilyTransactionType.INCOME, startDate, endDate);
        Long expenseMinor = transactionRepository.sumAmountMinorByTypeAndDateRange(
            userId, FamilyTransactionType.EXPENSE, startDate, endDate);

        BigDecimal income = minorToAmount(incomeMinor);
        BigDecimal expense = minorToAmount(expenseMinor);

        FamilyFinanceSummaryResponse response = new FamilyFinanceSummaryResponse();
        response.setTotalIncome(income);
        response.setTotalExpense(expense);
        response.setBalance(income.subtract(expense).setScale(2, RoundingMode.HALF_UP));
        return response;
    }

    @Transactional
    public FamilyBirthdayResponse createBirthday(String userEmail, FamilyBirthdayRequest request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        FamilyBirthday birthday = new FamilyBirthday();
        birthday.setUserId(userId);
        birthday.setFullName(request.getFullName());
        birthday.setRelationship(request.getRelationship());
        birthday.setBirthDate(request.getBirthDate());
        birthday.setPhone(request.getPhone());
        birthday.setEmail(request.getEmail());
        birthday.setNote(request.getNote());
        return toBirthdayResponse(birthdayRepository.save(birthday));
    }

    @Transactional(readOnly = true)
    public Page<FamilyBirthdayResponse> getBirthdays(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        return birthdayRepository.findByUserIdOrderByBirthDateAsc(userId, pageable)
            .map(this::toBirthdayResponse);
    }

    @Transactional(readOnly = true)
    public FamilyBirthdayResponse getBirthday(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        FamilyBirthday birthday = birthdayRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Family birthday not found"));
        return toBirthdayResponse(birthday);
    }

    @Transactional
    public FamilyBirthdayResponse updateBirthday(String userEmail, UUID id, FamilyBirthdayRequest request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        FamilyBirthday birthday = birthdayRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Family birthday not found"));
        birthday.setFullName(request.getFullName());
        birthday.setRelationship(request.getRelationship());
        birthday.setBirthDate(request.getBirthDate());
        birthday.setPhone(request.getPhone());
        birthday.setEmail(request.getEmail());
        birthday.setNote(request.getNote());
        return toBirthdayResponse(birthdayRepository.save(birthday));
    }

    @Transactional
    public void deleteBirthday(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        FamilyBirthday birthday = birthdayRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Family birthday not found"));
        birthdayRepository.delete(birthday);
    }

    @Transactional(readOnly = true)
    public List<FamilyBirthdayResponse> getUpcomingBirthdays(String userEmail, int days) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        LocalDate now = LocalDate.now();
        LocalDate limit = now.plusDays(days);

        return birthdayRepository.findByUserIdOrderByBirthDateAsc(userId, Pageable.unpaged()).getContent()
            .stream()
            .filter(b -> isUpcoming(b.getBirthDate(), now, limit))
            .sorted(Comparator.comparingLong(b -> daysUntilBirthday(b.getBirthDate(), now)))
            .map(this::toBirthdayResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CurrencyRateResponse getLatestFxRate(String code) {
        return currencyService.getLatestRate(code);
    }

    @Transactional(readOnly = true)
    public List<CurrencyRateResponse> getHistoricalFxRates(String code, LocalDateTime startDate, LocalDateTime endDate) {
        return currencyService.getHistoricalRates(code, startDate, endDate);
    }

    private FamilyTransactionResponse toTransactionResponse(FamilyTransaction tx) {
        FamilyTransactionResponse response = new FamilyTransactionResponse();
        response.setId(tx.getId());
        response.setType(tx.getType());
        response.setAmountMinor(tx.getAmountMinor());
        response.setCurrency(tx.getCurrency() != null ? tx.getCurrency().name() : CurrencyCode.TRY.name());
        response.setCategory(tx.getCategory());
        response.setOccurredOn(tx.getOccurredOn());
        response.setNote(tx.getNote());
        response.setCreatedAt(tx.getCreatedAt());
        response.setUpdatedAt(tx.getUpdatedAt());
        return response;
    }

    private FamilyBirthdayResponse toBirthdayResponse(FamilyBirthday birthday) {
        FamilyBirthdayResponse response = new FamilyBirthdayResponse();
        response.setId(birthday.getId());
        response.setFullName(birthday.getFullName());
        response.setRelationship(birthday.getRelationship());
        response.setBirthDate(birthday.getBirthDate());
        response.setPhone(birthday.getPhone());
        response.setEmail(birthday.getEmail());
        response.setNote(birthday.getNote());
        response.setCreatedAt(birthday.getCreatedAt());
        response.setUpdatedAt(birthday.getUpdatedAt());
        return response;
    }

    private BigDecimal minorToAmount(Long minor) {
        if (minor == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(minor).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private boolean isUpcoming(LocalDate birthDate, LocalDate now, LocalDate limit) {
        LocalDate next = nextBirthdayDate(birthDate, now);
        return !next.isBefore(now) && !next.isAfter(limit);
    }

    private long daysUntilBirthday(LocalDate birthDate, LocalDate now) {
        return ChronoUnit.DAYS.between(now, nextBirthdayDate(birthDate, now));
    }

    private LocalDate nextBirthdayDate(LocalDate birthDate, LocalDate now) {
        MonthDay md = MonthDay.from(birthDate);
        LocalDate inCurrentYear = md.atYear(now.getYear());
        if (!inCurrentYear.isBefore(now)) {
            return inCurrentYear;
        }
        return md.atYear(now.getYear() + 1);
    }
}
